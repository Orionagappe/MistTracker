// --- Mist Causality: Multi-User 4D Definite Item Tracker & 3D Physics Simulator Entry Point ---

import mysql from 'mysql2/promise';
import nvk from 'nvk';
import * as MistTracker from './MistTrackerVulkan.js';
import * as MistMulti from './MistMulti.cjs';
import * as MistIllum from './MistIllum.js';
import { storyWriter } from './MistTrackerVulkan.js';
import { ensureMistDatabase, updateMistData, loadMistUser, getMistDataTables } from './MistTrackerVulkan.js';
import { MistMenuControl, launchMistCore } from './MistIllum.js';
import { MenuManager, MenuPage, Button, Slider, Dropdown, ColorPicker } from './MistInterface.js';


class MistHostManager {
    constructor(renderContext, db) {
        this.renderContext = renderContext;
        this.db = db;
        this.menuManager = new MenuManager('hostMenu');
        this.activeSimulations = new Map();
        this.setupMenuSystem();
    }

    async setupMenuSystem() {
        // Main host menu
        const mainPage = new MenuPage('main')
            .addComponent(new Button('newVisualization')
                .setLabel('New nD Visualization')
                .onClick(() => this.menuManager.showPage('vizSetup')))
            .addComponent(new Button('newSimulation')
                .setLabel('New Physics Simulation')
                .onClick(() => this.menuManager.showPage('simSetup')))
            .addComponent(new Button('settings')
                .setLabel('Host Settings')
                .onClick(() => this.menuManager.showPage('settings')));

        // Visualization setup page
        const vizSetupPage = new MenuPage('vizSetup')
            .addComponent(new Dropdown('dimensions')
                .setLabel('Number of Dimensions')
                .setOptions(['3D', '4D', '5D', '6D', '7D'])
                .setValue('3D'))
            .addComponent(new Dropdown('renderMode')
                .setLabel('Render Mode')
                .setOptions(['Standard', 'Wave-Based', 'Quantum'])
                .setValue('Standard'))
            .addComponent(new Button('startViz')
                .setLabel('Start Visualization')
                .onClick(() => this.launchVisualization()));

        // Simulation setup page
        const simSetupPage = new MenuPage('simSetup')
            .addComponent(new Dropdown('physicsMode')
                .setLabel('Physics Mode')
                .setOptions(['Classical', 'Quantum', 'Hybrid'])
                .setValue('Classical'))
            .addComponent(new Slider('timeComponents')
                .setLabel('Time Dimensions')
                .setRange(1, 3)
                .setValue(1))
            .addComponent(new ColorPicker('energyColor')
                .setLabel('Energy Visualization Color'))
            .addComponent(new Button('startSim')
                .setLabel('Start Simulation')
                .onClick(() => this.launchSimulation()));

        // Settings page
        const settingsPage = new MenuPage('settings')
            .addComponent(new Slider('precision')
                .setLabel('Calculation Precision')
                .setRange(1, 18)
                .setValue(3))
            .addComponent(new Checkbox('multiUser')
                .setLabel('Enable Multi-User')
                .setValue(true))
            .addComponent(new Button('back')
                .setLabel('Back')
                .onClick(() => this.menuManager.showPage('main')));

        this.menuManager
            .addPage(mainPage)
            .addPage(vizSetupPage)
            .addPage(simSetupPage)
            .addPage(settingsPage);
    }

    async launchVisualization() {
        const config = {
            dimensions: this.menuManager.getComponent('dimensions').getValue(),
            renderMode: this.menuManager.getComponent('renderMode').getValue(),
            precision: this.menuManager.getComponent('precision').getValue()
        };

        // Create new MistClient instance for visualization
        const client = new MistClient({
            display: this.renderContext.display,
            windowId: this.renderContext.windowId,
            config: config
        });

        // Initialize visualization environment
        await client.initializeVisualization(config);
        this.activeSimulations.set(client.id, client);
    }

    async launchSimulation() {
        const config = {
            physicsMode: this.menuManager.getComponent('physicsMode').getValue(),
            timeComponents: this.menuManager.getComponent('timeComponents').getValue(),
            energyColor: this.menuManager.getComponent('energyColor').getValue(),
            precision: this.menuManager.getComponent('precision').getValue()
        };

        // Create new MistClient instance for simulation
        const client = new MistClient({
            display: this.renderContext.display,
            windowId: this.renderContext.windowId,
            config: config
        });

        // Initialize simulation environment
        await client.initializeSimulation(config);
        this.activeSimulations.set(client.id, client);
    }
}

async function main() {
    // Initialize Vulkan context
    const instance = new nvk.Instance({
        appName: "Mist Host",
        engineName: "MistCausality",
        vulkanVersion: nvk.VERSION_1_2,
        enabledExtensions: [
            "VK_KHR_surface",
            "VK_KHR_xlib_surface"
        ]
    });

    const renderContext = {
        instance,
        physicalDevice: instance.getPhysicalDevices()[0],
        display: null,
        windowId: null
    };

    // Initialize database connection
    const db = await mysql.createConnection({
        host: 'localhost',
        user: 'root',
        password: 'password',
        port: 3306
    });

    // Initialize X11 window
    const x11Client = await new Promise((resolve, reject) => {
        x11.createClient((err, display) => {
            if (err) reject(err);
            resolve(display);
        });
    });

    renderContext.display = x11Client;
    renderContext.windowId = x11Client.client.AllocID();

    // Create and initialize host manager
    const hostManager = new MistHostManager(renderContext, db);
    await hostManager.menuManager.showPage('main');

    // Setup cleanup
    process.on('SIGINT', async () => {
        for (const [id, client] of hostManager.activeSimulations) {
            await client.cleanup();
        }
        x11Client.client.DestroyWindow(renderContext.windowId);
        x11Client.client.close();
        process.exit(0);
    });
}

main().catch(console.error);