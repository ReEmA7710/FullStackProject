pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = "reemaalsubaie24"
        BACKEND_IMAGE   = "reemaalsubaie24/backend-demo:${BUILD_NUMBER}"
        FRONTEND_IMAGE  = "reemaalsubaie24/frontend:${BUILD_NUMBER}"
    }

    stages {

        stage('Build and Test') {
            parallel {
                
                stage('Frontend Pipeline') {
                    steps {
                        dir('frontend') {
                            sh '''
                                echo "Checking Node & NPM versions..."
                                node -v
                                npm -v
                                
                                echo "Installing dependencies..."
                                npm install
                                
                                echo "Running Angular unit tests..."
                                npx ng test --watch=false --browsers=ChromeHeadlessNoSandbox
                                
                                echo "Building Angular app..."
                                npm run build -- --configuration=production
                            '''
                        }
                    }
                }

                stage('Backend Pipeline') {
                    environment {
                        SPRING_PROFILES_ACTIVE = 'ci-test'
                    }
                    steps {
                        dir('backend') {
                            sh '''
                                echo "Packaging Spring Boot app..."
                                mvn clean package -DskipTests

                                echo "Running backend tests..."
                                mvn test
                            '''
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
