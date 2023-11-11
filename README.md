# Web Application

## Prerequisites
Before you can build and deploy this web application locally, you'll need to ensure that you have the following prerequisites installed:

- [Node.js](https://nodejs.org/)
- [Git](https://git-scm.com/)

## API Documentation
For detailed information on the API endpoints, request/response formats, and usage examples, please refer to the [API Documentation](https://app.swaggerhub.com/apis-docs/csye6225-webapp/cloud-native-webapp/fall2023-a3).

## Build and Deploy Instructions

### Using Packer & AMIs
- We use Packer to create a custom Application AMI, based on Debian 12.
- Ensure AMIs are private and only deployable by you.
- AMI builds occur in the DEV AWS account and are shared with the DEMO account.
- Builds are configured to run in the default VPC.
- The AMI includes necessary components such as Java, Tomcat, or the correct Python version and libraries.
- The application binary and configuration files are included, and services like Tomcat are set to auto-start.
- MySQL/MariaDB/PostgreSQL is installed for development purposes only.

### GitHub Actions Workflows
#### Status Check Workflow
- On pull requests, `packer fmt` is run for formatting checks.
- `packer validate` is run for template validation.
- The workflow fails upon any error, preventing merges.

#### AMI Build Workflow
- Triggered when pull requests are merged, not on creation.
- Integrations tests are run, and application artifacts are built.
- The AMI is created with application dependencies, and artifacts are copied over.
- The built AMI is shared with the DEMO account.

### Web Application
- The web application uses RDS instances for databases in production.
- Local databases are used for integration testing.
- Autorun is set up using `systemd` or other tools to wait for `cloud-init` completion.

### Cloud Integration
- Application logs are streamed to CloudWatch.
- Metrics for API calls are captured in CloudWatch.
- Custom metrics count the API calls for each endpoint.

### Local Setup Instructions
1. Clone the repository:
    ```
    git clone https://github.com/Romil-Tiwari1/webapp.git
    ```
2. Install dependencies:
    ```
    cd your-repo
    npm install
    ```
3. Run the application:
    ```
    npm start
    ```

## Technologies Used
-  Node.js
- Sequelize (ORM)
- AWS Packer
- GitHub Actions
- AWS CloudWatch

## Additional Notes
- Deletion of user accounts is not supported.
- `account_created` and `account_updated` fields are managed by the system.

## Contributors
This project is maintained by Romil Tiwari.

## License
This project is licensed.