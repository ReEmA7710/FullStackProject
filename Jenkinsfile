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
        stage('Email Notification') {
            steps {
                script {
                    emailext (
                        to: "reemar0o08@gmail.com",
                        subject: "[Jenkins] ${env.JOB_NAME} #${BUILD_NUMBER} → ${currentBuild.currentResult}",
                        body: """
                            <h2 style="color:#2F4F4F;">🚀 Jenkins Build Report</h2>
                            <ul>
                                <li><b>Job:</b> ${env.JOB_NAME}</li>
                                <li><b>Build:</b> #${BUILD_NUMBER}</li>
                                <li><b>Status:</b> <span style="color:${currentBuild.currentResult == 'SUCCESS' ? 'green' : 'red'}">${currentBuild.currentResult}</span></li>
                                <li><b>URL:</b> <a href="${env.BUILD_URL}">${env.BUILD_URL}</a></li>
                            </ul>
                        """,
                        mimeType: 'text/html'
                    )
                }
            }
        }
    }
}
