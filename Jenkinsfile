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

        stage('SonarQube Backend') {
            steps {
                withSonarQubeEnv('sonar-backend') {
                    sh 'mvn -f backend/pom.xml clean verify sonar:sonar -Dsonar.projectKey=backend-app'
                }
                timeout(time: 15, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('SonarQube Frontend Analysis') {
            steps {
                withSonarQubeEnv('sonar-frontend') {
                    script {
                        def scannerHome = tool 'sonar-scanner'
                        dir('frontend') {
                            sh """
                                ${scannerHome}/bin/sonar-scanner \
                                  -Dsonar.projectKey=frontend-app \
                                  -Dsonar.sources=. \
                                  -Dsonar.javascript.lcov.reportPaths=coverage/lcov.info
                            """
                        }
                        timeout(time: 15, unit: 'MINUTES') {
                            waitForQualityGate abortPipeline: true
                        }
                    }
                }
            }
        }

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

        stage('Deploy to Kubernetes') {
            steps {
                sh 'ansible-playbook -i ansible/inventory.ini ansible/deploy.yml'
            }
        }

    }
}
