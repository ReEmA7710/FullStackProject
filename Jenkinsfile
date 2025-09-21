pipeline {
    agent any

    environment {
        DOCKER_REGISTRY = "reemaalsubaie24"
        BACKEND_IMAGE   = "reemaalsubaie24/backend-demo:${BUILD_NUMBER}"
        FRONTEND_IMAGE  = "reemaalsubaie24/frontend:${BUILD_NUMBER}"
        SONAR_HOST      = "http://52.58.59.157:9000"
        NEXUS_URL       = "http://52.58.59.157:8081"  
    }

    stages {

        stage('SonarQube') {
            steps {
                withSonarQubeEnv('SonarQube') {
                    withCredentials([string(credentialsId: 'sonar', variable: 'SONAR_TOKEN')]) {
                        sh """
                            mvn clean verify sonar:sonar \
                              -Dsonar.projectKey=fullstack-project \
                              -Dsonar.host.url=$SONAR_HOST \
                              -Dsonar.login=$SONAR_TOKEN
                        """
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 5, unit: 'MINUTES') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

        stage('Nexus Publish') {
            steps {
                withCredentials([usernamePassword(
                    credentialsId: 'Nexus',
                    usernameVariable: 'NEXUS_USER',
                    passwordVariable: 'NEXUS_PASS'
                )]) {
                    nexusArtifactUploader(
                        artifacts: [[
                            artifactId: 'backend-demo',
                            classifier: '',
                            file: 'backend/target/backend-demo-0.0.1.jar',
                            type: 'jar'
                        ]],
                        credentialsId: 'Nexus',
                        groupId: 'com.devops',
                        nexusUrl: "$NEXUS_URL",
                        nexusVersion: 'nexus3',
                        protocol: 'http',
                        repository: 'FullStack',
                        version: "0.0.1-${env.BUILD_NUMBER}"
                    )
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

        stage('Docker Push using Ansible') {
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

    } // نهاية stages
} // نهاية pipeline
