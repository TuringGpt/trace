const { CloudRunClient } = require('@google-cloud/run');
const { GoogleAuth } = require('google-auth-library');

const projectId = process.env.GCP_PROJECT_ID;
const region = process.env.GCP_REGION;
const serviceAccountKeyPath = process.env.GOOGLE_APPLICATION_CREDENTIALS;

async function authenticateServiceAccount() {
  const auth = new GoogleAuth({
    keyFilename: serviceAccountKeyPath,
    scopes: 'https://www.googleapis.com/auth/cloud-platform',
  });

  const authClient = await auth.getClient();
  return authClient;
}

async function deployService(authClient) {
  const client = new CloudRunClient({ client: authClient, projectId, region });

  const serviceName = process.env.GCP_SERVICE_NAME;
  const imageUrl = `gcr.io/${projectId}/${process.env.GCP_IMAGE_NAME}:latest`;

  const service = {
    apiVersion: 'serving.knative.dev/v1',
    kind: 'Service',
    metadata: {
      name: serviceName,
      namespace: projectId,
    },
    spec: {
      template: {
        spec: {
          containers: [
            {
              image: imageUrl,
            },
          ],
        },
      },
    },
  };

  try {
    const [operation] = await client.createService({
      parent: `namespaces/${projectId}`,
      service,
    });
    const [response] = await operation.promise();
    console.log('Service deployed successfully:', response);
  } catch (error) {
    console.error('Failed to deploy:', error);
  }
}

authenticateServiceAccount()
  .then((authClient) => deployService(authClient))
  .catch(console.error);
