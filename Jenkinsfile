pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = "reemaalsubaie24"
        BACKEND_IMAGE = "${DOCKER_REGISTRY}/backend:${BUILD_NUMBER}"
        FRONTEND_IMAGE = "${DOCKER_REGISTRY}/frontend:${BUILD_NUMBER}"
    }

    stages {

        stage('Docker Build') {
            steps {
                echo "🔨 Building Docker images..."
                sh """
                    ansible-playbook -i ansible/inventory.ini ansible/build.yml \
                      -e backend_image=${BACKEND_IMAGE} \
                      -e frontend_image=${FRONTEND_IMAGE}
                """
            }
        }

        stage('Docker Push') {
            steps {
                echo "📦 Pushing images to Docker Hub..."
                withCredentials([usernamePassword(
                    credentialsId: 'docker',
                    usernameVariable: 'DOCKER_USERNAME',
                    passwordVariable: 'DOCKER_PASSWORD'
                )]) {
                    sh """
                        ansible-playbook -i ansible/inventory.ini ansible/push.yml \
                          -e backend_image=${BACKEND_IMAGE} \
                          -e frontend_image=${FRONTEND_IMAGE} \
                          -e docker_username=${DOCKER_USERNAME} \
                          -e docker_password=${DOCKER_PASSWORD}
                    """
                }
            }
        }

        stage('Deploy to Kubernetes') {
            steps {
                echo "🚀 Deploying to Kubernetes..."
                sh """
                    ansible-playbook -i ansible/inventory.ini ansible/deploy.yml \
                      -e backend_image=${BACKEND_IMAGE} \
                      -e frontend_image=${FRONTEND_IMAGE}
                """
            }
        }
    }

    post {
        success {
            echo "✅ Pipeline finished successfully!"
        }
        failure {
            echo "❌ Pipeline failed, please check logs."
        }
    }
}
