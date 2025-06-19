e = m * c^2 
e = (m * c^2) + (0.5 * m * v^2(1 + (3 * v^2)/(4 * c^2))) 
e = sqrt((m * c^2)^2 + (p * c)^2)

tensor = {
    rank: 4,
    dimensions: [4, 4],
    data: [
        [(C^2 - 2 * G * M /R), 0, 0, 0],
        [0, ( -1 / 1 - (2 * G * M)), 0, 0],
        [0, 0, -R^2, 0],
        [0, 0, 0, -R^2 * sin^2(theta)]
    ]
}

C^2 = 1 / (1 - (2 * G * M) / R)
D^2 = X^2 + Y^2 + Z^2

// Hypothetical physics engine for pure math and physics simulations pure math
// Time dialation
W = T[0] - T[1] // Perspective time difference.
T[1] = sqrt((1 - (2 * G * M[1] / R * C^2))) * T[0] // c = undefined.
// Time dilation based on mass and distance from a gravitational source.
D * S^2 = C^2 * (T[1] - T[0])^2 - (X[1] - X[0])^2 - (Y[1] - Y[0])^2 - (Z[1] - Z[0])^2 // Events in space time.
if (W > X) {
    // Event horizon reached, cull object.
    cullObject(obj); // Test
    if (objType = user){
        deleteAccount(user);
    }
}

obj.T[1] - obj.T[0] = (self.T[1] - self.T[0]) * ( 1 / sqrt(1 - (V^2 / C^2)))  // object perspective time difference. Time dilation effect.

metricTensor = {
    rank: 5,
    dimensions: [5, 5],
    data: [
        [-1, 0, 0, 0, 0],
        [0, 1, 0, 0, 0],
        [0, 0, 1, 0, 0],
        [0, 0, 0, 1, 0],
        [0, 0, 0, 0, 1]
    ]
}
T = metricTensor[1]; //time
X = metricTensor[2]; //space
Y = metricTensor[3]; //space
Z = metricTensor[4]; //space
W = metricTensor[5]; //gravity
//  * Distribute energy across extra dimensions.


E = H * C / lambda
lambda = C / F // Wavelength = Speed of causality / Frequency

// Intensity frame of reference and projected plane
I = [0, 0, 0] // Intensity array for different angles
theta = 0 // Angle in radians
I[0] = 1
I[1] = I[0] cos^2(theta) // Intensity at angle theta
I[2] = I[1] cos^2(theta) // Intensity at angle theta

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
    const time2 = distance2 / C; // Time taken for light to reach obj2
    return time1 === time2; // Returns true if both objects receive light at the same time
};
// Calculate the interference pattern of light waves from a single source
if (lightWave = true){ 
    interferencePattern = (source, obj1, obj2) => {
        const distance1 = D(source, obj1);
        const distance2 = D(source, obj2);
        const phaseDifference = (distance1 - distance2) * (2 * Math.PI / lambda); // Phase difference based on wavelength
        return Math.cos(phaseDifference); // Interference pattern based on cosine of phase difference
    };

}
// Apply interference pattern to wave objects
applyInterference = (source, obj1, obj2) => {
    const pattern = interferencePattern(source, obj1, obj2);
    obj1.intensity *= pattern; // Adjust intensity based on interference pattern
    obj2.intensity *= pattern; // Adjust intensity based on interference pattern
};
// Interference limiter if wave length is greater than distance between objects
distanceBetweenObj = D(obj1, obj2); // Distance between two objects
if(wave.length > distanceBetweenObj) {
    // Apply interference pattern to wave objects
    applyInterference = (source, obj1, obj2) => {
        const pattern = interferencePattern(source, obj1, obj2);
        obj1.intensity *= pattern; // Adjust intensity based on interference pattern
        obj2.intensity *= pattern; // Adjust intensity based on interference pattern
    };
};

E = (H * F) A; // Energy = Planck's constant * Frequency * Amplitude of wave
//Theory for culling objects based on interaction type
//Euler Lagrange equation for wave function
eulerLagrange = (L, q, qDot) => {
    // L is the Lagrangian, q is the generalized coordinate, and qDot is the generalized velocity
    return (d/dt)(∂L/∂qDot) - ∂L/∂q; // Euler-Lagrange equation
};
// Gauss's law of magnetism
gaussLawMagnetism = (B) => {
    // Gauss's law for magnetism states that the magnetic flux through a closed surface is zero
    return Math.abs(B) === 0; // Returns true if magnetic field B is zero
};
// principle of stationary action
principleOfStationaryAction = (action) => {
    // The action is stationary if the variation of the action is zero
    return (d/dt)(∫L dt) === 0; // Returns true if the action is stationary
};

