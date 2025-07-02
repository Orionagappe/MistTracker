// Declare all variables before use
let m = 1, c = 299792458, v = 0, p = 0, G = 6.67430e-11, M = 1, R = 1, theta = 0;
let e = m * Math.pow(c, 2);
e = (m * Math.pow(c, 2)) + (0.5 * m * Math.pow(v, 2) * (1 + (3 * Math.pow(v, 2)) / (4 * Math.pow(c, 2))));
e = Math.sqrt(Math.pow(m * Math.pow(c, 2), 2) + Math.pow(p * c, 2));

let tensor = {
    rank: 4,
    dimensions: [4, 4],
    data: [
        [(Math.pow(c, 2) - 2 * G * M / R), 0, 0, 0],
        [0, (-1 / (1 - (2 * G * M / R))), 0, 0],
        [0, 0, -Math.pow(R, 2), 0],
        [0, 0, 0, -Math.pow(R, 2) * Math.pow(Math.sin(theta), 2)]
    ]
};

let C = Math.sqrt(1 / (1 - (2 * G * M) / R));
let X = 0, Y = 0, Z = 0, S = 1;
let D2 = Math.pow(X, 2) + Math.pow(Y, 2) + Math.pow(Z, 2); // D squared = X squared + Y squared + Z squared

// Hypothetical physics engine for pure math and physics simulations
// Time dilation
let T = [0, 0];
let W = T[0] - T[1]; // Perspective time difference.
T[1] = Math.sqrt((1 - (2 * G * M / (R * Math.pow(C, 2)))) ) * T[0]; // c = defined above.
// Time dilation based on mass and distance from a gravitational source.
let D = 1;
let eventResult = Math.pow(D * Math.pow(S, 2), 1) === Math.pow(C, 2) * Math.pow(T[1] - T[0], 2) - Math.pow(X - X, 2) - Math.pow(Y - Y, 2) - Math.pow(Z - Z, 2); // Events in space time.
if (W > X) {
    // Event horizon reached, cull object.
    cullObject(obj); // Test - obj is not defined, comment out or define obj if needed
    if (objType === 'user'){
        deleteAccount(user);
    }
}

if (obj && obj.T && self && self.T) {
    let V = 0;
    let objTimeDiff = obj.T[1] - obj.T[0] === (self.T[1] - self.T[0]) * ( 1 / Math.sqrt(1 - (Math.pow(V, 2) / Math.pow(C, 2))));  // object perspective time difference. Time dilation effect.
    if (objTimeDiff > 0) {
        
    }
}

let metricTensor = {
    rank: 5,
    dimensions: [5, 5],
    data: [
        [-1, 0, 0, 0, 0],
        [0, 1, 0, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 0, 1, 0],
        [0, 0, 0, 0, 1]
    ]
};
// Example assignments (not physically meaningful, just placeholders)
T = metricTensor.data[0][0]; //time
X = metricTensor.data[1][1]; //space
Y = metricTensor.data[2][2]; //space
Z = metricTensor.data[3][3]; //space
W = metricTensor.data[4][4]; //gravity
//  * Distribute energy across extra dimensions.

let H = 6.62607015e-34; // Planck's constant
let F = 1; // Frequency placeholder
let lambda = C / F; // Wavelength = Speed of causality / Frequency
let E = H * C / lambda;
lambda = C / F // Wavelength = Speed of causality / Frequency

// Intensity frame of reference and projected plane
I = [0, 0, 0] // Intensity array for different angles
theta = 0 // Angle in radians
I[0] = 1;
// Probablistic wave function
let A = 1, k = 1, x = 1, omega = 1, t = 1;
let psi = A * Math.exp(j * (k * x - omega * t)); // Wave function (note: 1j is not valid in JS, use complex library if needed)

// Probablistic wave function
psi = A * exp(i * (k * x - omega * t)) // Wave function

// Bells theorem culling logic
bellTheorem = (a, b, c, d) => {
    return Math.abs(a * b + c * d) <= 2; // Bell's inequality
};

D = distanceBetweenPoints = (p1, p2) => {   
    return Math.sqrt(
        Math.pow(p2[0] - p1[0], 2) +
        Math.pow(p2[1] - p1[1], 2) +
        Math.pow(p2[2] - p1[2], 2)
    );
}
R = relativeAcceleration = (v1, v2, t) => {
    return (v2 - v1) / t; // Relative acceleration between two velocities over time
}

//pilot wave theory only for use on defined objects
pilotWave = (psi, potential) => {
    // Calculate the pilot wave based on the wave function and potential
    return psi * potential; // Simplified representation
};

locality = (p1, p2) => {
    // Check if two points are local to each other
    return D(p1, p2) < 1; // Local if distance is less than 1 unit
}

// relationship between light wave emitted by a single source object and the wave arrives at two objects at the sme time
lightWave = (source, obj1, obj2) => {
    const distance1 = D(source, obj1);
    const distance2 = D(source, obj2);
    const time1 = distance1 / C; // Time taken for light to reach obj1
let interferencePattern = (source, obj1, obj2) => {
    const distance1 = D(source, obj1);
    const distance2 = D(source, obj2);
    const phaseDifference = (distance1 - distance2) * (2 * Math.PI / lambda); // Phase difference based on wavelength
    return Math.cos(phaseDifference); // Interference pattern based on cosine of phase difference
};
        return Math.cos(phaseDifference); // Interference pattern based on cosine of phase difference
    };


// Apply interference pattern to wave objects
applyInterference = (source, obj1, obj2) => {
    const pattern = interferencePattern(source, obj1, obj2);
    obj1.intensity *= pattern; // Adjust intensity based on interference pattern
    obj2.intensity *= pattern; // Adjust intensity based on interference pattern
};
// let wave = { length: 1 }; // Placeholder for wave object
// let obj1 = { intensity: 1 }, obj2 = { intensity: 1 }; // Placeholder objects
// let distanceBetweenObj = D(obj1, obj2); // Distance between two objects
// if(wave.length > distanceBetweenObj) {
//     // Apply interference pattern to wave objects
//     applyInterference(source, obj1, obj2);
// }
    

E = (H * F) * A; // Energy = Planck's constant * Frequency * Amplitude of wave
//Theory for culling objects based on interaction type
//Euler Lagrange equation for wave function
let eulerLagrange = (L, q, qDot) => {
    // L is the Lagrangian, q is the generalized coordinate, and qDot is the generalized velocity
    // Placeholder: Euler-Lagrange equation cannot be computed symbolically in JS
    return null;
};
let gaussLawMagnetism = (B) => {
    // Gauss's law for magnetism states that the magnetic flux through a closed surface is zero
    return Math.abs(B) === 0; // Returns true if magnetic field B is zero
};
// principle of stationary action
let principleOfStationaryAction = (action) => {
    // The action is stationary if the variation of the action is zero
    // In actual physics, this would be: d/dt(∂L/∂qDot) - ∂L/∂q = 0
    // Here, we return a placeholder as this cannot be computed directly in JS
    return action === 0; // Placeholder: Returns true if the action is stationary
};

// multiple wave object composer
let composeWaves = (waves) => {
    // waves is an array of wave objects
    return waves.reduce((acc, wave) => {
        acc.intensity += wave.intensity; // Sum intensities of all waves
        return acc;
    }, { intensity: 0 }); // Initialize accumulator with intensity 0
};

// intensity relationship with object hardness
let intensityHardnessRelationship = (intensity, hardness) => {
    // Placeholder relationship: Higher intensity leads to higher hardness
    return intensity * hardness; // Returns a product of intensity and hardness
};

// Example usage of the intensity relationship
let intensity = 10; // Example intensity
let hardness = 5; // Example hardness
let hardnessEffect = intensityHardnessRelationship(intensity, hardness);

// Partical wave duality
let particleWaveDuality = (particle, wave) => {
    // Placeholder for particle-wave duality relationship
    return {
        position: particle.position,
        wavelength: wave.wavelength,
        frequency: wave.frequency
    };
};

// Energy distribution across extra dimensions
let distributeEnergy = (energy, dimensions) => {
    // Distribute energy across extra dimensions
    let distribution = {};
    dimensions.forEach(dim => {
        distribution[dim] = energy / dimensions.length; // Equal distribution for simplicity
    });
    return distribution;
};

// Example usage of energy distribution
let energy = 100; // Example energy
let extraDimensions = ['x', 'y', 'z', 'w']; // Example extra dimensions
let energyDistribution = distributeEnergy(energy, extraDimensions);

// Deform objects based on energy distribution
let deformObject = (object, energyDistribution) => {
    // Deform object based on energy distribution
    Object.keys(energyDistribution).forEach(dim => {
        if (object[dim] !== undefined) {
            object[dim] += energyDistribution[dim]; // Adjust dimension based on energy distribution
        }
    });
    return object;
};

// Example object to deform
let object = { x: 1, y: 2, z: 3 }; // Example object by location.
let selfLocation = { x: 0, y: 0, z: 0 }; // Self location for reference
let deformedObject = deformObject(object, energyDistribution); // Deform the object based on energy distribution

// User interaction with objects
let userInteraction = (user, object) => {
    // User interacts with an object
    if (user && object) {
        // Example interaction: User applies force to the object
        object.force = user.force; // User's force applied to the object
        return object;
    }
    return null; // No interaction if user or object is not defined
};

// Project object from data based on user menu interaction. Object definitions are in data.
let projectObject = (object, userMenu) => {
    // Project object based on user menu interaction
    if (userMenu && object) {
        // Example projection: Adjust object's properties based on user menu selection
        object.projectedProperty = userMenu.selectedProperty; // User's selected property applied to the object
        return object;
    }
    return null; // No projection if user menu or object is not defined
};

// Initial 3d mode landscape generation
let generateLandscape = (width, height, depth) => {
    // Generate a 3D landscape based on width, height, and depth
    let landscape = [];
    for (let x = 0; x < width; x++) {
        for (let y = 0; y < height; y++) {
            for (let z = 0; z < depth; z++) {
                landscape.push({ x: x, y: y, z: z }); // Add point to landscape
            }
        }
    }
    return landscape; // Return generated landscape
};

// Example usage of landscape generation
let landscape = generateLandscape(10, 10, 10); // Generate a 10x10x10 landscape

// Unless otherwise defined assume Gravity is 9.81 m/s^2 and is applied to all objects.
// Within the 3d environment of the physics engine, gravity can be applied to objects based on their mass and distance from the bottom of the landscape assuming the landscape is a projection on a sphere that is the same size as the Earth in the 3d environment.
let applyGravity = (object, gravity = 9.81) => {
    // Apply gravity to the object based on its mass
    if (object && object.mass) {
        object.weight = object.mass * gravity; // Weight = mass * gravity
        return object;
    }
    return null; // No gravity applied if object or mass is not defined
}

// 5D metric tensor: [time, x, y, z, w] (w = gravity/energy)
const metricTensor5D = {
    rank: 5,
    dimensions: [5, 5],
    data: [
        [-1, 0, 0, 0, 0],
        [0, 1, 0, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 0, 1, 0],
        [0, 0, 0, 0, 1]
    ]
};

const defaultLightSource = {
    type: 'star',
    position: [0, 0, 0], // Sun at origin
    intensity: 1.0,
    color: [1, 1, 0.9],
    radius: 6.96e8 // meters (Sun radius)
};

const defaultObserver = {
    position: [1.496e11, 0, 0], // 1 AU from Sun
};

function createVoxelObject(center, size, angularMomentumMap = {}) {
    // size: [x, y, z] in voxels
    let voxels = [];
    for (let x = 0; x < size[0]; x++) {
        for (let y = 0; y < size[1]; y++) {
            for (let z = 0; z < size[2]; z++) {
                voxels.push({ x: center[0] + x, y: center[1] + y, z: center[2] + z });
            }
        }
    }
    return {
        center,
        voxels,
        angularMomentumMap, // { edgeIndex: {axis: [lx,ly,lz], value: L} }
        distanceFromObserver: null, // to be computed
        hardness: 1, // default
        energy: 0
    };
}

function updateDistanceFromObserver(object, observer) {
    const dx = object.center[0] - observer.position[0];
    const dy = object.center[1] - observer.position[1];
    const dz = object.center[2] - observer.position[2];
    object.distanceFromObserver = Math.sqrt(dx*dx + dy*dy + dz*dz);
}

function computeAngularMomentumMap(object) {
    // For each edge voxel, assign or compute angular momentum
    // Placeholder: assign random or default values
    object.angularMomentumMap = {};
    object.voxels.forEach((v, idx) => {
        if (isEdgeVoxel(v, object)) {
            object.angularMomentumMap[idx] = { axis: [0, 1, 0], value: 1 }; // Example
        }
    });
}
function isEdgeVoxel(v, object) {
    // Simple check: if voxel is on the boundary of the object
    const minX = Math.min(...object.voxels.map(vox => vox.x));
    const maxX = Math.max(...object.voxels.map(vox => vox.x));
    const minY = Math.min(...object.voxels.map(vox => vox.y));
    const maxY = Math.max(...object.voxels.map(vox => vox.y));
    const minZ = Math.min(...object.voxels.map(vox => vox.z));
    const maxZ = Math.max(...object.voxels.map(vox => vox.z));
    return v.x === minX || v.x === maxX || v.y === minY || v.y === maxY || v.z === minZ || v.z === maxZ;
}

function interactObjects(objA, objB, tensor = metricTensor5D) {
    // Example: Use tensor to compute deformation and energy transfer
    // Deformation depends on hardness and energy distribution
    let deformationA = objB.energy / objA.hardness;
    let deformationB = objA.energy / objB.hardness;
    deformObject(objA, distributeEnergy(deformationA, ['x', 'y', 'z', 'w']));
    deformObject(objB, distributeEnergy(deformationB, ['x', 'y', 'z', 'w']));
    // Optionally update angular momentum maps
}

function spawnObjectNearPlayer(player, objectData) {
    // Assume player has a position and a reference surface normal
    const normal = player.referenceNormal || [1, 0, 0];
    const spawnPos = player.position.map((v, i) => v + normal[i] * 1); // 1 meter away
    let obj = createVoxelObject(spawnPos, objectData.size, objectData.angularMomentumMap);
    obj.momentum = player.momentum || [0, 0, 0];
    return obj;
}

// Set up environment
const observer = defaultObserver;
const sun = defaultLightSource;

// Create two objects
let obj1 = createVoxelObject([5, 5, 5], [3, 3, 3]);
let obj2 = createVoxelObject([8, 5, 5], [3, 3, 3]);

// Update distances
updateDistanceFromObserver(obj1, observer);
updateDistanceFromObserver(obj2, observer);

// Compute angular momentum maps
computeAngularMomentumMap(obj1);
computeAngularMomentumMap(obj2);

// Interact objects using power 5 tensor
interactObjects(obj1, obj2);

// If user loads a new object
let player = { position: [0, 0, 0], referenceNormal: [1, 0, 0], momentum: [0, 0, 0] };
let newObj = spawnObjectNearPlayer(player, { size: [2, 2, 2], angularMomentumMap: {} });


let m1 = 1, m2 = 4.5, m3 = 21.0;
// Use T[0] to evolve quantum states or mass-dependent calculations
t = T[1]; // Use for waveFunction, interferencePattern, etc.
let deltaV = 1.5e-55 * C; // For cosmological calculations

const metricTensor7D = {
    rank: 7,
    dimensions: [7, 7],
    data: [
        // T[0] (quantum time), T[1] (interaction time), T[2] (cosmo time), X, Y, Z, W
        [-1, 0, 0, 0, 0, 0, 0], // T[0]
        [0, -1, 0, 0, 0, 0, 0], // T[1]
        [0, 0, -1, 0, 0, 0, 0], // T[2]
        [0, 0, 0, 1, 0, 0, 0],  // X
        [0, 0, 0, 0, 1, 0, 0],  // Y
        [0, 0, 0, 0, 0, 1, 0],  // Z
        [0, 0, 0, 0, 0, 0, 1]   // W (energy/gravity)
    ]
};

function waveFunction(A, k, x, omega, T) {
    // T is [T0, T1, T2]
    let t = T[1];
    return A * Math.exp(1 * j * (k * x - omega * t));
}
function quantumMassEvolution(masses, T) {
    // masses: [m1, m2, m3]
    // T[0] is quantum time
    // Example: evolve mass states over T[0]
    return masses.map((m, i) => m * Math.exp(-T[0] / (i + 1)));
}
function gravWaveDeltaV(T) {
    // T[2] is cosmological time
    return 1.5e-55 * C * T[2];
}
// Example: position = [T0, T1, T2, X, Y, Z, W]
function tensorTransform(tensor, vec) {
    let result = new Array(tensor.rank).fill(0);
    for (let i = 0; i < tensor.rank; ++i)
        for (let j = 0; j < tensor.rank; ++j)
            result[i] += tensor.data[i][j] * vec[j];
    return result;
}
// Define time vector for a simulation step
let T = [quantumTime, interactionTime, cosmologicalTime];

// Use T[1] for all current time-based calculations
psi = waveFunction(A, k, x, omega, T);

// Use T[0] for quantum mass calculations
evolvedMasses = quantumMassEvolution([1, 4.5, 21.0], T);

// Use T[2] for cosmological/gravitational wave calculations
deltaV = gravWaveDeltaV(T);

// Use the extended tensor for all metric operations
let position = [T[0], T[1], T[2], X, Y, Z, W];
let transformed = tensorTransform(metricTensor7D, position);

// --- Map 3 time dimensions to 3D space ---
// Example: X = f(T[0], T[1], T[2]), etc.
function timeToSpace(T) {
    // T: [T0, T1, T2]
    // Example mapping: simple product and scaling (customize as needed)
    let scale = 1; // Adjust scale as needed
    let X = scale * T[0] * T[1];
    let Y = scale * T[1] * T[2];
    let Z = scale * T[2] * T[0];
    return [X, Y, Z];
}

// --- Revised landscape generation using time dimensions ---
function generateLandscapeFromTime(T0_range, T1_range, T2_range, scale = 1) {
    // T0_range, T1_range, T2_range: arrays of allowed values for each time dimension
    let landscape = [];
    for (let t0 of T0_range) {
        for (let t1 of T1_range) {
            for (let t2 of T2_range) {
                let [x, y, z] = timeToSpace([t0, t1, t2]);
                landscape.push({ x, y, z, T: [t0, t1, t2] });
            }
        }
    }
    return landscape;
}

// --- Example usage ---
// Define ranges for each time dimension (quantum, interaction, cosmological)
let T0_range = [0, 1, 2]; // quantum time steps
let T1_range = [0, 1, 2]; // interaction time steps
let T2_range = [0, 1, 2]; // cosmological time steps

let userEnvironment = generateLandscapeFromTime(T0_range, T1_range, T2_range);

// Now userEnvironment is a 3D grid where each point is a product of the three time dimensions

// --- Update object placement and movement to use time-based space ---
// For any object, its position is determined by its T vector:
function setObjectPositionFromTime(object, T) {
    let [x, y, z] = timeToSpace(T);
    object.x = x;
    object.y = y;
    object.z = z;
    object.T = T;
    return object;
}

// Example: Place an object at a specific time triple
let myObject = {};
setObjectPositionFromTime(myObject, [1, 2, 3]);

// --- Optionally, update all spatial calculations to use this mapping ---
// For example, when moving an object in time, update its spatial position:
function moveObjectInTime(object, dT) {
    let newT = object.T.map((t, i) => t + (dT[i] || 0));
    return setObjectPositionFromTime(object, newT);
}