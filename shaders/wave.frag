#version 450

// Inputs from vertex shader
layout(location = 0) in vec3 fragPosition;
layout(location = 1) in vec2 fragComplexAmplitude;
layout(location = 2) in vec4 fragQuantumNumbers;
layout(location = 3) in vec4 fragMetadata;

// Uniform buffer for visualization parameters
layout(set = 0, binding = 0) uniform VisualizationParams {
    vec4 baseColor;         // Base color for wave function
    vec4 phaseColor;        // Color for phase visualization
    float minEnergy;        // Minimum energy level
    float maxEnergy;        // Maximum energy level
    float opacity;          // Global opacity
    int visualMode;         // Visualization mode
} vis;

// Output color
layout(location = 0) out vec4 outColor;

// Helper function to convert HSV to RGB
vec3 hsv2rgb(vec3 c) {
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
}

void main() {
    // Calculate probability density
    float probability = fragComplexAmplitude.x * fragComplexAmplitude.x + 
                       fragComplexAmplitude.y * fragComplexAmplitude.y;
                       
    // Calculate phase angle
    float phase = atan(fragComplexAmplitude.y, fragComplexAmplitude.x);
    
    // Normalize energy to [0,1] range
    float normalizedEnergy = (fragMetadata.x - vis.minEnergy) / 
                            (vis.maxEnergy - vis.minEnergy);
    
    vec4 color;
    if (vis.visualMode == 0) {
        // Probability density visualization
        color = vec4(vis.baseColor.rgb * probability, probability * vis.opacity);
    }
    else if (vis.visualMode == 1) {
        // Phase visualization using HSV color wheel
        vec3 hsvColor = vec3(
            (phase + 3.14159) / 6.28318, // Map [-π,π] to [0,1] for hue
            1.0,                         // Full saturation
            probability                  // Value based on probability
        );
        color = vec4(hsv2rgb(hsvColor), vis.opacity);
    }
    else if (vis.visualMode == 2) {
        // Energy level visualization
        vec3 energyColor = mix(vec3(0.0, 0.0, 1.0), vec3(1.0, 0.0, 0.0), normalizedEnergy);
        color = vec4(energyColor * probability, vis.opacity);
    }
    else {
        // Quantum number visualization
        vec3 qnColor = normalize(abs(fragQuantumNumbers.xyz));
        color = vec4(qnColor * probability, vis.opacity);
    }
    
    outColor = color;
}
