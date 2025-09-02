pipeline {
    agent any

    environment {
        IMAGE_NAME = 'reemaalsubaie24/compare-app'
    }

    stages {
        stage('Build') {
            steps {
                script {
                    try {
                        sh 'mvn clean package -DskipTests=true'
                        env.STAGE_BUILD = "SUCCESS"
                    } catch (err) {
                        env.STAGE_BUILD = "FAILURE"
                        throw err
                    }
                }
            }
        }

        stage('Test') {
            steps {
                script {
                    try {
                        sh 'mvn test'
                        env.STAGE_TEST = "SUCCESS"
                    } catch (err) {
                        env.STAGE_TEST = "FAILURE"
                        throw err
                    }
                }
            }
        }

        stage('SonarQube') {
            steps {
                script {
                    try {
                        withSonarQubeEnv('SonarQube') {
                            withCredentials([string(credentialsId: 'sonar', variable: 'SONAR_TOKEN')]) {
                                sh """
                                    mvn verify sonar:sonar \
                                      -Dsonar.projectKey=compare-app \
                                      -Dsonar.host.url=$SONAR_HOST \
                                      -Dsonar.login=$SONAR_TOKEN
                                """
                            }
                        }
                        env.STAGE_SONAR = "SUCCESS"
                    } catch (err) {
                        env.STAGE_SONAR = "FAILURE"
                        throw err
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                script {
                    try {
                        timeout(time: 5, unit: 'MINUTES') {
                            waitForQualityGate abortPipeline: true
                        }
                        env.STAGE_QG = "SUCCESS"
                    } catch (err) {
                        env.STAGE_QG = "FAILURE"
                        throw err
                    }
                }
            }
        }

        stage('Nexus_Publish') {
            steps {
                script {
                    try {
                        nexusArtifactUploader(
                            artifacts: [[artifactId: 'numeric', classifier: '', file: 'target/numeric-0.0.1.jar', type: 'jar']],
                            credentialsId: 'Nexus',
                            groupId: 'com.devops',
                            nexusUrl: "$NEXUS_URL",
                            nexusVersion: 'nexus3',
                            protocol: 'http',
                            repository: 'compare-service',
                            version: "0.0.1-${env.BUILD_NUMBER}"
                        )
                        env.STAGE_NEXUS = "SUCCESS"
                    } catch (err) {
                        env.STAGE_NEXUS = "FAILURE"
                        throw err
                    }
                }
            }
        }

    stage('Docker Build with Ansible') {
    steps {
        script {
            try {
                withCredentials([
                    usernamePassword(
                        credentialsId: 'docker',
                        usernameVariable: 'DOCKER_USERNAME',
                        passwordVariable: 'DOCKER_PASSWORD'
                    )
                ]) {
                    sh """
                        ansible-playbook -i inventory.ini Build_Docker.yaml \
                            -e build_context=${WORKSPACE} \
                    """
                }
                env.STAGE_DOCKER_BUILD = "SUCCESS"
            } catch (err) {
                env.STAGE_DOCKER_BUILD = "FAILURE"
                throw err
            }
        }
    }
}
        stage('Docker Push with Ansible') {
            steps {
                script {
                    try {
                        withCredentials([usernamePassword(credentialsId: 'docker', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                            sh """
                                ansible-playbook -i /etc/ansible/hosts push-docker.yaml \
                                -e build_context=${WORKSPACE} \
                                
                            """
                        }
                        env.STAGE_DOCKER_PUSH = "SUCCESS"
                    } catch (err) {
                        env.STAGE_DOCKER_PUSH = "FAILURE"
                        throw err
                    }
                }
            }
        }

        stage('Deploy with Ansible') {
            steps {
                script {
                    try {
                        sh """
                            ansible-playbook -i /etc/ansible/hosts deploy_container.yaml \
                              -e docker_image=$IMAGE_NAME:latest
                        """
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
                    <tr><td style='padding:8px;'>Build</td><td style='text-align:center;'>${statusIcon(env.STAGE_BUILD)}</td></tr>
                    <tr><td style='padding:8px;'>Test</td><td style='text-align:center;'>${statusIcon(env.STAGE_TEST)}</td></tr>
                    <tr><td style='padding:8px;'>SonarQube</td><td style='text-align:center;'>${statusIcon(env.STAGE_SONAR)}</td></tr>
                    <tr><td style='padding:8px;'>Quality Gate</td><td style='text-align:center;'>${statusIcon(env.STAGE_QG)}</td></tr>
                    <tr><td style='padding:8px;'>Upload-to-Nexus</td><td style='text-align:center;'>${statusIcon(env.STAGE_NEXUS)}</td></tr>
                    <tr><td style='padding:8px;'>Docker Build</td><td style='text-align:center;'>${statusIcon(env.STAGE_DOCKER_BUILD)}</td></tr>
                    <tr><td style='padding:8px;'>Docker Push</td><td style='text-align:center;'>${statusIcon(env.STAGE_DOCKER_PUSH)}</td></tr>
                    <tr><td style='padding:8px;'>Deploy</td><td style='text-align:center;'>${statusIcon(env.STAGE_DEPLOY)}</td></tr>
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
