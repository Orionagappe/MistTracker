#version 450

// Vertex attributes (match tensorND format)
layout(location = 0) in vec3 inPosition;
layout(location = 1) in vec4 inTensor1;    // First 4 tensor components
layout(location = 2) in vec4 inTensor2;    // Next 4 tensor components
layout(location = 3) in vec4 inMetadata;   // Rank, dimensions, etc.

// Outputs to fragment shader
layout(location = 0) out vec3 fragPosition;
layout(location = 1) out vec4 fragTensor1;
layout(location = 2) out vec4 fragTensor2;
layout(location = 3) out vec4 fragMetadata;

// Push constants
layout(push_constant) uniform PushConstants {
    mat4 model;
    mat4 view;
    mat4 projection;
    // Tensor-specific transforms
    mat4 tensorProjection;    // Projects from nD to 3D
    float timeComponent;      // For temporal evolution
} push;

// Calculate tensor magnitude for visualization
float calculateTensorMagnitude() {
    float magnitude = 0.0;
    
    // Sum squares of components
    vec4 t1 = inTensor1 * inTensor1;
    vec4 t2 = inTensor2 * inTensor2;
    
    magnitude = sqrt(t1.x + t1.y + t1.z + t1.w +
                    t2.x + t2.y + t2.z + t2.w);
                    
    return magnitude;
}

void main() {
    // Project tensor components to 3D space
    vec4 projectedPos = push.tensorProjection * vec4(inPosition, 1.0);
    
    // Scale position based on tensor magnitude
    float magnitude = calculateTensorMagnitude();
    projectedPos.xyz *= (1.0 + magnitude * 0.1); // Subtle scaling effect
    
    // Calculate world space position
    vec4 worldPos = push.model * projectedPos;
    
    // Pass tensor data to fragment shader
    fragPosition = worldPos.xyz;
    fragTensor1 = inTensor1;
    fragTensor2 = inTensor2;
    fragMetadata = inMetadata;
    
    // Calculate final position
    gl_Position = push.projection * push.view * worldPos;
    
    // Vary point size based on tensor magnitude
    gl_PointSize = 2.0 + magnitude * 2.0;
}
