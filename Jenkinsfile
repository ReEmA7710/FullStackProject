pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = "reemaalsubaie24"
        BACKEND_IMAGE   = "reemaalsubaie24/backend-demo:${BUILD_NUMBER}"
        FRONTEND_IMAGE  = "reemaalsubaie24/frontend:${BUILD_NUMBER}"
    }

    stages {

        stage('Build & Test All Projects') {
            parallel {
                stage('Frontend Build & Test') {
                    steps {
                        script {
                            try {
                                dir('frontend') {
                                    sh '''
                                        echo "==> Checking Node & NPM versions..."
                                        node -v
                                        npm -v
                                        
                                        echo "==> Installing frontend dependencies..."
                                        npm ci
                                        
                                        echo "==> Running Angular tests (headless)..."
                                        xvfb-run -a npx ng test --watch=false --browsers=ChromeHeadless
                                        
                                        echo "==> Building Angular production bundle..."
                                        npm run build -- --configuration=production
                                    '''
                                }
                                env.STAGE_FE_BUILD = "SUCCESS"
                            } catch (err) {
                                env.STAGE_FE_BUILD = "FAILURE"
                                throw err
                            }
                        }
                    }
                }
                stage('Backend Build & Test') {
                    environment { SPRING_PROFILES_ACTIVE = 'ci-testing' }
                    steps {
                        script {
                            try {
                                dir('backend') {
                                    sh '''
                                        echo "==> Packaging backend application (tests skipped)..."
                                        mvn clean package -DskipTests
                                        
                                        echo "==> Running backend unit tests..."
                                        mvn test
                                    '''
                                }
                                env.STAGE_BE_BUILD = "SUCCESS"
                            } catch (err) {
                                env.STAGE_BE_BUILD = "FAILURE"
                                throw err
                            }
                        }
                    }
                }
            }
        }

        stage('SonarQube Analysis') {
            parallel {
                stage('SonarQube Backend') {
                    steps {
                        script {
                            try {
                                withSonarQubeEnv('sonar-backend-server') {
                                    sh '''
                                        mvn -f backend/pom.xml clean verify sonar:sonar \
                                          -Dsonar.projectKey=backend-app \
                                          -Dsonar.projectName=backend-app
                                    '''
                                }
                                timeout(time: 15, unit: 'MINUTES') {
                                    waitForQualityGate abortPipeline: true
                                }
                                env.STAGE_SONAR_BE = "SUCCESS"
                            } catch (err) {
                                env.STAGE_SONAR_BE = "FAILURE"
                                throw err
                            }
                        }
                    }
                }

                stage('SonarQube Frontend') {
                    steps {
                        script {
                            try {
                                withSonarQubeEnv('sonar-frontend-server') {
                                    def scannerHome = tool 'sonar-scanner'
                                    dir('frontend') {
                                        sh """
                                            ${scannerHome}/bin/sonar-scanner \
                                              -Dsonar.projectKey=frontend-app \
                                              -Dsonar.projectName=frontend-app \
                                              -Dsonar.sources=. \
                                              -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
                                        """
                                    }
                                }
                                timeout(time: 15, unit: 'MINUTES') {
                                    waitForQualityGate abortPipeline: true
                                }
                                env.STAGE_SONAR_FE = "SUCCESS"
                            } catch (err) {
                                env.STAGE_SONAR_FE = "FAILURE"
                                throw err
                            }
                        }
                    }
                }
            }
        }

        stage('Upload to Nexus') {
            parallel {
                stage('Upload Backend to Nexus') {
                    steps {
                        script {
                            try {
                                dir('backend') {
                                    nexusArtifactUploader artifacts: [[
                                        artifactId: 'demo',
                                        classifier: '',
                                        file: "target/demo-0.0.1-SNAPSHOT.jar",
                                        type: 'jar'
                                    ]],
                                    credentialsId: 'Nexus',
                                    groupId: 'com.example',
                                    nexusUrl: "${NEXUS_URL}",
                                    nexusVersion: 'nexus3',
                                    protocol: 'http',
                                    repository: 'backend-repo',
                                    version: "${BUILD_NUMBER}"
                                }
                                env.STAGE_NEXUS_BE = "SUCCESS"
                            } catch (err) {
                                env.STAGE_NEXUS_BE = "FAILURE"
                                throw err
                            }
                        }
                    }
                }

                stage('Upload Frontend to Nexus') {
                    steps {
                        script {
                            try {
                                dir('frontend') {
                                    sh 'tar -czf frontend-${BUILD_NUMBER}.tgz -C dist .'
                                    nexusArtifactUploader artifacts: [[
                                        artifactId: 'frontend',
                                        classifier: '',
                                        file: "frontend-${BUILD_NUMBER}.tgz",
                                        type: 'tgz'
                                    ]],
                                    credentialsId: 'Nexus',
                                    groupId: 'com.example.frontend',
                                    nexusUrl: "${NEXUS_URL}",
                                    nexusVersion: 'nexus3',
                                    protocol: 'http',
                                    repository: 'frontend-repo',
                                    version: "${BUILD_NUMBER}"
                                }
                                env.STAGE_NEXUS_FE = "SUCCESS"
                            } catch (err) {
                                env.STAGE_NEXUS_FE = "FAILURE"
                                throw err
                            }
                        }
                    }
                }
            }
        }

        stage('Docker Build') {
            steps {
                script {
                    try {
                        withCredentials([usernamePassword(
                            credentialsId: 'docker',
                            usernameVariable: 'DOCKER_USERNAME',
                            passwordVariable: 'DOCKER_PASSWORD'
                        )]) {
                            sh 'ansible-playbook -i ansible/inventory.ini ansible/build.yml'
                        }
                        env.STAGE_DOCKER_BUILD = "SUCCESS"
                    } catch (err) {
                        env.STAGE_DOCKER_BUILD = "FAILURE"
                        throw err
                    }
                }
            }
        }

        stage('Docker Push') {
            steps {
                script {
                    try {
                        withCredentials([usernamePassword(
                            credentialsId: 'docker',
                            usernameVariable: 'DOCKER_USERNAME',
                            passwordVariable: 'DOCKER_PASSWORD'
                        )]) {
                            sh 'ansible-playbook -i ansible/inventory.ini ansible/push.yml'
                        }
                        env.STAGE_DOCKER_PUSH = "SUCCESS"
                    } catch (err) {
                        env.STAGE_DOCKER_PUSH = "FAILURE"
                        throw err
                    }
                }
            }
        }

        stage('Deploy') {
            steps {
                script {
                    try {
                        sh 'ansible-playbook -i ansible/inventory.ini ansible/deploy.yml'
                        env.STAGE_DEPLOY = "SUCCESS"
                    } catch (err) {
                        env.STAGE_DEPLOY = "FAILURE"
                        throw err
                    }
                }
            }
        }
    }

    post {
        always {
            script {
                def jobName = env.JOB_NAME
                def buildNumber = env.BUILD_NUMBER
                def pipelineStatus = currentBuild.currentResult.toUpperCase()
                def buildTime = new Date().format("yyyy-MM-dd HH:mm:ss")
                def bannerColor = pipelineStatus == 'SUCCESS' ? '#28a745' : '#dc3545'

                def statusIcon = { status ->
                    if (status == 'SUCCESS') return "✅"
                    else if (status == 'FAILURE') return "❌"
                    else return "⚪"
                }

                def stageTable = """
                <table style='border-collapse: collapse; width: 100%; font-family: Arial, sans-serif;'>
                    <tr style='background-color: #0073e6; color:white;'>
                        <th style='padding:10px; text-align:left;'>Stage</th>
                        <th style='padding:10px; text-align:left;'>Status</th>
                    </tr>
                    <tr><td>Frontend Build & Test</td><td style='text-align:center;'>${statusIcon(env.STAGE_FE_BUILD)}</td></tr>
                    <tr><td>Backend Build & Test</td><td style='text-align:center;'>${statusIcon(env.STAGE_BE_BUILD)}</td></tr>
                    <tr><td>SonarQube Backend</td><td style='text-align:center;'>${statusIcon(env.STAGE_SONAR_BE)}</td></tr>
                    <tr><td>SonarQube Frontend</td><td style='text-align:center;'>${statusIcon(env.STAGE_SONAR_FE)}</td></tr>
                    <tr><td>Nexus Backend</td><td style='text-align:center;'>${statusIcon(env.STAGE_NEXUS_BE)}</td></tr>
                    <tr><td>Nexus Frontend</td><td style='text-align:center;'>${statusIcon(env.STAGE_NEXUS_FE)}</td></tr>
                    <tr><td>Docker Build</td><td style='text-align:center;'>${statusIcon(env.STAGE_DOCKER_BUILD)}</td></tr>
                    <tr><td>Docker Push</td><td style='text-align:center;'>${statusIcon(env.STAGE_DOCKER_PUSH)}</td></tr>
                    <tr><td>Deploy</td><td style='text-align:center;'>${statusIcon(env.STAGE_DEPLOY)}</td></tr>
                </table>
                """

                def body = """
                <html>
                    <body style="font-family: Arial, sans-serif; background-color:#f0f2f5; padding:20px;">
                        <div style="max-width: 700px; margin:auto; border: 3px solid ${bannerColor}; padding: 20px; border-radius: 12px; background:white; box-shadow: 0 4px 8px rgba(0,0,0,0.1);">
                            <h2 style="margin-bottom:5px;">${jobName} - Build #${buildNumber}</h2>
                            <div style="background-color: ${bannerColor}; padding: 12px; border-radius: 5px; margin-bottom:15px;">
                                <h3 style="color: white; margin:0; text-align:center;">Pipeline Status: ${pipelineStatus}</h3>
                            </div>
                            <p style="font-size:14px;">Build Time: ${buildTime}</p>
                            <p style="font-size:14px;">For more details, please <a href="${env.BUILD_URL}">view the Console Output</a>.</p>
                            <h3 style="margin-top:20px;">Stage Summary</h3>
                            ${stageTable}
                        </div>
                    </body>
                </html>
                """

                emailext(
                    subject: "${jobName} - Build ${buildNumber} - ${pipelineStatus}",
                    body: body,
                    to: 'reemar0o08@gmail.com',
                    from: 'jenkins@example.com',
                    replyTo: 'jenkins@example.com',
                    mimeType: 'text/html'
                )
            }
        }
    }
}
