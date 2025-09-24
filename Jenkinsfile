pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = "reemaalsubaie24"
        BACKEND_IMAGE   = "reemaalsubaie24/backend-demo:${BUILD_NUMBER}"
        FRONTEND_IMAGE  = "reemaalsubaie24/frontend:${BUILD_NUMBER}"
    }

    stages {
       
        stage('Nexus Upload') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'nexus',
                    usernameVariable: 'NEXUS_USER',
                    passwordVariable: 'NEXUS_PASS'
                )]) {
                    dir('backend') {
                        sh './mvnw deploy -DskipTests -Dnexus.username=$NEXUS_USER -Dnexus.password=$NEXUS_PASS'
                    }

                    dir('frontend') {
                        sh 'npm install'
                        sh 'npm run build'
                        sh "zip -r frontend-dist-${BUILD_NUMBER}.zip dist/"
                        sh "curl -u $NEXUS_USER:$NEXUS_PASS --upload-file frontend-dist-${BUILD_NUMBER}.zip ${NEXUS_URL}/repository/frontend-raw/frontend-dist-${BUILD_NUMBER}.zip"
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
