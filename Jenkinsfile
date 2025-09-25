pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = "reemaalsubaie24"
        BACKEND_IMAGE   = "reemaalsubaie24/backend-demo:${BUILD_NUMBER}"
        FRONTEND_IMAGE  = "reemaalsubaie24/frontend:${BUILD_NUMBER}"
    }

    stages {
       
       stage('SonarQube Analysis - Backend') {
    steps {
        dir('backend') {
            withCredentials([string(credentialsId: 'sonar-backend-token', variable: 'SONAR_TOKEN')]) {
                sh """
                mvn clean verify sonar:sonar \
                  -Dsonar.projectKey=backend-app \
                  -Dsonar.host.url=${SONAR_HOST} \
                  -Dsonar.login=$SONAR_TOKEN
                """
            }
        }
    }
}

stage('SonarQube Analysis - Frontend') {
    steps {
        dir('frontend') {
            withCredentials([string(credentialsId: 'sonar-frontend-token', variable: 'SONAR_TOKEN')]) {
                sh """
                npx sonar-scanner \
                  -Dsonar.projectKey=frontend-app \
                  -Dsonar.sources=src \
                  -Dsonar.host.url=${SONAR_HOST} \
                  -Dsonar.login=$SONAR_TOKEN
                """
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
