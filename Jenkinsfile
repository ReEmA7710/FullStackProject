pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = "reemaalsubaie24"
        BACKEND_IMAGE   = "reemaalsubaie24/backend-demo:${BUILD_NUMBER}"
        FRONTEND_IMAGE  = "reemaalsubaie24/frontend:${BUILD_NUMBER}"
    }

    stages {

       stage('Build & test'){
      parallel {
        stage('Build & Test Frontend') {
          steps {
            dir('frontend') {
              sh 'node -v && npm -v'
              sh 'npm ci'
              sh 'xvfb-run -a npx ng test --watch=false --browsers=ChromeHeadless'
              sh 'npm run build'
            }
          }
        }
        stage('Build & Test Backend') {
          environment { SPRING_PROFILES_ACTIVE = 'test-no-db' }
          steps {
            dir('backend'){
              sh 'mvn clean package -DskipTests=true'
              sh 'mvn test'
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
