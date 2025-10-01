pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = "reemaalsubaie24"
        BACKEND_IMAGE   = "reemaalsubaie24/backend-demo:${BUILD_NUMBER}"
        FRONTEND_IMAGE  = "reemaalsubaie24/frontend:${BUILD_NUMBER}"
    }

    stages {

        /* ---------------- BUILD & TEST ---------------- */
        stage('Build & Test All Projects') {
            parallel {
                stage('Frontend Build & Test') {
                    steps {
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
                    }
                }
                stage('Backend Build & Test') {
                    environment { SPRING_PROFILES_ACTIVE = 'ci-testing' }
                    steps {
                        dir('backend') {
                            sh '''
                                echo "==> Packaging backend application (tests skipped)..."
                                mvn clean package -DskipTests
                                
                                echo "==> Running backend unit tests..."
                                mvn test
                            '''
                        }
                    }
                }
            }
        }

        /* ---------------- SONARQUBE ---------------- */
        stage('SonarQube Analysis') {
            parallel {
                stage('SonarQube Backend') {
                    steps {
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
                    }
                }

                stage('SonarQube Frontend') {
                    steps {
                        withSonarQubeEnv('sonar-frontend-server') {
                            script {
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
                        }
                        timeout(time: 15, unit: 'MINUTES') {
                            waitForQualityGate abortPipeline: true
                        }
                    }
                }
            }
        }

        /* ---------------- NEXUS UPLOAD ---------------- */
        stage('Upload to Nexus') {
            parallel {

                stage('Upload Backend to Nexus') {
                    steps {
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
                    }
                }

                stage('Upload Frontend to Nexus') {
                    steps {
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
                    }
                }

            }
        }

        /* ---------------- DOCKER ---------------- */
        stage('Docker Build') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'docker',
                    usernameVariable: 'DOCKER_USERNAME',
                    passwordVariable: 'DOCKER_PASSWORD'
                )]) {
                    sh 'ansible-playbook -i ansible/inventory.ini ansible/build.yml'
                }
            }
        }

        stage('Docker Push') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'docker',
                    usernameVariable: 'DOCKER_USERNAME',
                    passwordVariable: 'DOCKER_PASSWORD'
                )]) {
                    sh 'ansible-playbook -i ansible/inventory.ini ansible/push.yml'
                }
            }
        }

        /* ---------------- DEPLOY ---------------- */
        stage('Deploy') {
            steps {
                sh 'ansible-playbook -i ansible/inventory.ini ansible/deploy.yml'
            }
        }

        /* ---------------- EMAIL ---------------- */
       post {
        always {
            script {
                def jobName = env.JOB_NAME
                def buildNumber = env.BUILD_NUMBER
                def pipelineStatus = currentBuild.currentResult
                def pipelineStatusUpper = pipelineStatus.toUpperCase()
                def bannerColor = pipelineStatusUpper == 'SUCCESS' ? 'green' : 'red'

                def body = """<html>
                    <body>
                        <div style="border: 4px solid ${bannerColor}; padding: 10px;">
                            <h2>${jobName} - Build ${buildNumber}</h2>
                            <div style="background-color: ${bannerColor}; padding: 10px;">
                                <h3 style="color: white;">Pipeline Status: ${pipelineStatusUpper}</h3>
                            </div>
                            <p>Check the <a href="${env.BUILD_URL}">console output</a>.</p>
                            <p style="font-size: 16px;">The build has finished with a <strong>${pipelineStatusUpper}</strong> status.</p>

                            
                        </div>
                    </body>
                </html>"""

                emailext (
                    subject: "${jobName} - Build ${buildNumber} - ${pipelineStatusUpper}",
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
