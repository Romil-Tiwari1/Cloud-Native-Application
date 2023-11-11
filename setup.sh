#!/bin/bash

# Update package lists
sudo apt update

# Install Node.js and npm
sudo apt install -y nodejs npm

# Create a dedicated non-privileged user for the application
if [ -d "/opt/webapp" ]; then
    sudo useradd -r -M -d /home/appUser appUser
else
    sudo useradd -r -m -d /opt/webapp appUser
fi

# Create cwagent users if they don't already exist
id -u cwagent &>/dev/null || sudo useradd -r -M -s /sbin/nologin cwagent

# Ensure user's home directory exists and set permissions
sudo mkdir -p /home/appUser
sudo chown appUser:appUser /home/appUser
sudo chmod 755 /home/appUser

# Create a group for log access and add both appUser and cwagent to it
sudo groupadd -f loggroup
sudo usermod -a -G loggroup appUser
sudo usermod -a -G loggroup cwagent

# Ensure /opt/webapp directory exists and set permissions
sudo mkdir -p /opt/webapp
sudo chown -R appUser:appUser /opt/webapp
sudo chmod -R 755 /opt/webapp

# Ensure log and environment files exist with correct permissions
sudo mkdir -p /var/log/webapp
sudo chown -R appUser:loggroup /var/log/webapp
sudo chmod -R 775 /var/log/webapp

# Ensure log and environment files exist with correct permissions
sudo touch /var/log/userdata.log
sudo chown appUser:appUser /var/log/userdata.log
sudo chmod 775 /var/log/userdata.log

# Create environment file and set correct permissions
sudo touch /etc/webapp.env
sudo chown appUser:appUser /etc/webapp.env
sudo chmod 644 /etc/webapp.env

# Navigate to webapp directory or exit if not found
cd /opt/webapp || exit

# Install other npm dependencies
sudo -u appUser npm uninstall bcrypt --prefix /opt/webapp
sudo -u appUser npm install bcrypt --prefix /opt/webapp
sudo -u appUser npm install sequelize mysql2 --prefix /opt/webapp
sudo -u appUser npm install dotenv --prefix /opt/webapp
sudo -u appUser npm install --prefix /opt/webapp

# Ensure log and environment files exist with correct permissions
sudo mkdir -p /var/log/webapp
sudo chown -R appUser:loggroup /var/log/webapp
sudo chmod -R 775 /var/log/webapp
sudo touch /var/log/webapp/access.log
sudo touch /var/log/webapp/application.log

# Create the log files after npm installations
sudo touch /var/log/webapp/access.log
sudo touch /var/log/webapp/application.log
sudo chown appUser:loggroup /var/log/webapp/access.log
sudo chown appUser:loggroup /var/log/webapp/application.log
sudo chmod 775 /var/log/webapp/access.log
sudo chmod 775 /var/log/webapp/application.log

# Create environment file and set correct permissions
sudo touch /etc/webapp.env
sudo chown appUser:appUser /etc/webapp.env
sudo chmod 644 /etc/webapp.env

# List the permissions and ownership of the log files
echo "Listing Permissions of Log Files before script"
ls -l /var/log/webapp

# Create the service file for webapp
sudo bash -c 'cat > /etc/systemd/system/webapp.service <<EOL
[Unit]
Description=Node.js WebApp
After=/lib/systemd/system/network.target /lib/systemd/system/cloud-final.service
Wants=/lib/systemd/system/cloud-final.service

[Service]
ExecStartPre=/bin/sleep 20
EnvironmentFile=/etc/webapp.env
ExecStart=/usr/bin/node /opt/webapp/index.js
WorkingDirectory=/opt/webapp
StandardOutput=journal
StandardError=journal
Restart=always
RestartSec=30s
User=appUser
Group=loggroup

[Install]
WantedBy=multi-user.target
EOL'


# List the permissions and ownership of the log files
echo "Listing Permissions of Log Files after script"
ls -l /var/log/webapp

# Enable and start the webapp service
sudo systemctl daemon-reload
sudo systemctl enable webapp.service
sudo systemctl start webapp.service

# Clean up any unnecessary packages
sudo apt-get autoremove -y
sudo apt-get autoclean -y
sudo apt-get clean -y
sudo apt purge -y git
sudo apt clean

echo "Setup completed successfully."
# End of script
