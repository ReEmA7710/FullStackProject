pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = "nouraa253"
        BACKEND_IMAGE = "nouraa253/demo-backend:${BUILD_NUMBER}"
        FRONTEND_IMAGE = "nouraa253/demo-frontend:${BUILD_NUMBER}"
    }

      stages {

        stage('Docker Build') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'docker',
                    usernameVariable: 'DOCKER_USERNAME',
                    passwordVariable: 'DOCKER_PASSWORD'
                )]) {
                    sh """
                        ansible-playbook -i ansible/inventory.ini ansible/build.yml \
                    """
                }
            }
        }

        stage('Docker Push using Ansible') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'docker',
                    usernameVariable: 'DOCKER_USERNAME',
                    passwordVariable: 'DOCKER_PASSWORD'
                )]) {
                    sh """
                        ansible-playbook -i ansible/inventory.ini ansible/push.yml \
                    """
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
