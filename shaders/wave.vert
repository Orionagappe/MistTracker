#version 450

// Vertex attributes (match waveFunction format)
layout(location = 0) in vec3 inPosition;
layout(location = 1) in vec2 inComplexAmplitude;  // (real, imaginary)
layout(location = 2) in vec4 inQuantumNumbers;    // (n, l, m, s)
layout(location = 3) in vec4 inMetadata;          // (energy, probability, etc.)

// Outputs to fragment shader
layout(location = 0) out vec3 fragPosition;
layout(location = 1) out vec2 fragComplexAmplitude;
layout(location = 2) out vec4 fragQuantumNumbers;
layout(location = 3) out vec4 fragMetadata;

// Push constants
layout(push_constant) uniform PushConstants {
    mat4 model;
    mat4 view;
    mat4 projection;
    float time;             // Current time for wave evolution
    float planckConstant;   // ℏ (h/2π)
    float mass;            // Particle mass
} push;

// Calculate wave function phase
float calculatePhase() {
    float energy = inMetadata.x;
    // ψ(x,t) = ψ(x,0) * exp(-iEt/ℏ)
    float phase = -energy * push.time / push.planckConstant;
    return phase;
}

void main() {
    // Calculate phase evolution
    float phase = calculatePhase();
    
    // Apply time evolution to complex amplitude
    float real = inComplexAmplitude.x * cos(phase) - inComplexAmplitude.y * sin(phase);
    float imag = inComplexAmplitude.x * sin(phase) + inComplexAmplitude.y * cos(phase);
    
    // Calculate probability density
    float probability = real * real + imag * imag;
    
    // Scale position based on probability
    vec3 scaledPosition = inPosition * (1.0 + probability * 0.1);
    
    // Calculate world space position
    vec4 worldPos = push.model * vec4(scaledPosition, 1.0);
    
    // Pass data to fragment shader
    fragPosition = worldPos.xyz;
    fragComplexAmplitude = vec2(real, imag);
    fragQuantumNumbers = inQuantumNumbers;
    fragMetadata = vec4(inMetadata.x, probability, inMetadata.z, inMetadata.w);
    
    // Calculate final position
    gl_Position = push.projection * push.view * worldPos;
    
    // Vary point size based on probability
    gl_PointSize = 2.0 + probability * 3.0;
}
