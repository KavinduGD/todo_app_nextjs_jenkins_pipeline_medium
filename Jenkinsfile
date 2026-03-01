pipeline {
    agent any

    environment {
        DOCKER_USERNAME="kavinduorg"
        DOCKER_IMAGE = "todo"
        IMAGE_TAG = "${BUILD_NUMBER}"
        DOCKERHUB_PASS=credentials('dockerhubtoken')
        DEPLOY_SERVER_IP = "13.205.140.129"
    }


    stages {

        stage('Build'){
            agent{
                docker{
                    image 'node:22-alpine'
                    reuseNode true
                    args '-u root' 
                }
            }
            steps{
                sh '''
                    npm install
                    npm run build
                '''
            }
        }

        stage('Test') {
            agent{
                docker{
                    image 'node:22-alpine'
                    reuseNode true
                    args '-u root' 
                }
            }
            
            steps {
                sh '''
                    npm test
                '''
            }
        }

        stage('SonarQube Analysis') {
            steps {
                script {
                    def scannerHome = tool 'sonar_scanner'
                    withSonarQubeEnv('sonar_server') {
                        sh """
                            ${scannerHome}/bin/sonar-scanner
                        """
                    }
                }
            }
        }

        stage('Quality Gate') {
            steps {
                timeout(time: 1, unit: 'HOURS') {
                    waitForQualityGate abortPipeline: true
                }
            }
        }

         stage('Build Docker Image') {
            steps {
                sh '''
                docker build -t $DOCKER_USERNAME/$DOCKER_IMAGE:$IMAGE_TAG .              
                '''
            }
        }

        stage('Login to Docker Hub') {
            steps {
                
                sh '''
                 echo $DOCKERHUB_PASS | docker login -u $DOCKER_USERNAME --password-stdin
                '''
                
            }
        }

        stage('Push Image to Docker Hub') {
            steps {
                sh '''
                docker push $DOCKER_USERNAME/$DOCKER_IMAGE:$IMAGE_TAG
                '''
            }
        }

        // curl exits with exit code 0 if the HTTP response code is 2xx or 3xx
        // and with exit error code 22 for 4xx or 5xx responses
        stage('Deploy') {
            steps {
                sh '''
                curl --fail -X GET http://$DEPLOY_SERVER_IP:3456/todo-deploy \
                ''' 
            }
        }


    }

     post {
        always {
             sh '''
            docker logout || true
            docker rmi $DOCKER_USERNAME/$DOCKER_IMAGE:$IMAGE_TAG || true
            '''
        }
    }
}

