const { spawn } = require('child_process');
const path = require('path');

async function buildVulkanBindings() {
    // Ensure nvk is installed
    await runCommand('npm install nvk --save');

    // Build nvk with specified Vulkan version
    await runCommand('npm run build --vkversion=1.2.0', {
        cwd: path.join(__dirname, '../node_modules/nvk')
    });
}

function runCommand(command, options = {}) {
    return new Promise((resolve, reject) => {
        const proc = spawn(command, {
            shell: true,
            stdio: 'inherit',
            ...options
        });

        proc.on('close', (code) => {
            if (code === 0) {
                resolve();
            } else {
                reject(new Error(`Command failed with exit code ${code}`));
            }
        });
    });
}

buildVulkanBindings().catch(console.error);
