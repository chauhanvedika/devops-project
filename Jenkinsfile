// EIMS CI/CD pipeline (declarative).
// Agent needs: docker, kubectl, kustomize (deploy stage only), aws cli (push stage only).
// With REGISTRY empty the pipeline still tests, validates, builds and scans - nothing is pushed.
pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    timeout(time: 30, unit: 'MINUTES')
    buildDiscarder(logRotator(numToKeepStr: '10'))
  }

  parameters {
    string(name: 'REGISTRY', defaultValue: '', description: 'ECR registry host, e.g. 123456789012.dkr.ecr.ap-south-1.amazonaws.com. Empty = build and scan only.')
    string(name: 'AWS_REGION', defaultValue: 'ap-south-1', description: 'AWS region for ECR login')
    booleanParam(name: 'DEPLOY', defaultValue: false, description: 'Deploy to the cluster after a successful push (needs REGISTRY)')
  }

  environment {
    TRIVY_IMAGE = 'aquasec/trivy:0.55.2'
  }

  stages {
    stage('Checkout') {
      steps {
        checkout scm
        script {
          env.IMAGE_TAG = sh(script: 'git rev-parse --short=8 HEAD', returnStdout: true).trim()
          env.PREFIX = params.REGISTRY ? "${params.REGISTRY}/" : ''
        }
        echo "Building ${env.IMAGE_TAG}"
      }
    }

    stage('Test & validate') {
      parallel {
        stage('Backend tests') {
          agent { docker { image 'node:20-alpine'; args '-e HOME=/tmp'; reuseNode true } }
          steps { dir('backend') { sh 'npm ci && npm test' } }
        }
        stage('Frontend build') {
          agent { docker { image 'node:20-alpine'; args '-e HOME=/tmp'; reuseNode true } }
          steps { dir('frontend') { sh 'npm ci && npm run build' } }
        }
        stage('Kubernetes manifests') {
          steps {
            sh '''
              for o in local aws; do
                kubectl kustomize k8s/overlays/$o | docker run --rm -i ghcr.io/yannh/kubeconform:v0.6.7 -strict -summary -kubernetes-version 1.30.0 -
              done
            '''
          }
        }
      }
    }

    stage('Build images') {
      steps {
        sh '''
          docker build -t ${PREFIX}eims-backend:${IMAGE_TAG}  ./backend
          docker build -t ${PREFIX}eims-frontend:${IMAGE_TAG} ./frontend
        '''
      }
    }

    stage('Security scan (Trivy)') {
      steps {
        // Fails the build on fixable HIGH/CRITICAL vulnerabilities.
        sh '''
          for img in eims-backend eims-frontend; do
            docker run --rm -v /var/run/docker.sock:/var/run/docker.sock -v trivy-cache:/root/.cache/ \
              ${TRIVY_IMAGE} image --exit-code 1 --severity HIGH,CRITICAL --ignore-unfixed --no-progress \
              ${PREFIX}${img}:${IMAGE_TAG}
          done
        '''
      }
    }

    stage('Push to ECR') {
      when { expression { params.REGISTRY?.trim() } }
      steps {
        sh '''
          aws ecr get-login-password --region ${AWS_REGION} | docker login --username AWS --password-stdin ${REGISTRY}
          docker push ${PREFIX}eims-backend:${IMAGE_TAG}
          docker push ${PREFIX}eims-frontend:${IMAGE_TAG}
        '''
      }
    }

    stage('Deploy') {
      when { allOf { expression { params.DEPLOY }; expression { params.REGISTRY?.trim() } } }
      steps {
        withCredentials([file(credentialsId: 'eims-kubeconfig', variable: 'KUBECONFIG')]) {
          sh '''
            rm -rf .deploy && cp -r k8s .deploy && cd .deploy/overlays/aws
            kustomize edit set image eims-backend=${PREFIX}eims-backend:${IMAGE_TAG}
            kustomize edit set image eims-frontend=${PREFIX}eims-frontend:${IMAGE_TAG}
            kustomize build . | kubectl apply -f -
            kubectl -n eims rollout status deployment/eims-backend  --timeout=180s
            kubectl -n eims rollout status deployment/eims-frontend --timeout=120s
          '''
        }
      }
      post {
        failure {
          withCredentials([file(credentialsId: 'eims-kubeconfig', variable: 'KUBECONFIG')]) {
            sh 'kubectl -n eims rollout undo deployment/eims-backend || true; kubectl -n eims rollout undo deployment/eims-frontend || true'
          }
        }
      }
    }
  }

  post {
    always {
      sh 'rm -rf .deploy; docker image prune -f || true'
    }
  }
}
