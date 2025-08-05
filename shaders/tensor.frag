#version 450

// Inputs from vertex shader
layout(location = 0) in vec3 fragPosition;
layout(location = 1) in vec4 fragTensor1;
layout(location = 2) in vec4 fragTensor2;
layout(location = 3) in vec4 fragMetadata;

// Uniform buffer for visualization parameters
layout(set = 0, binding = 0) uniform VisualizationParams {
    vec4 colorMap[4];        // Color gradient for tensor values
    float minValue;          // Minimum tensor value
    float maxValue;          // Maximum tensor value
    float opacity;           // Global opacity
    int colorMode;          // Visualization mode
} vis;

// Output color
layout(location = 0) out vec4 outColor;

// Helper function to map tensor values to colors
vec4 getTensorColor(float value) {
    float normalizedValue = (value - vis.minValue) / (vis.maxValue - vis.minValue);
    normalizedValue = clamp(normalizedValue, 0.0, 1.0);
    
    // Interpolate through color map
    if (normalizedValue < 0.33) {
        return mix(vis.colorMap[0], vis.colorMap[1], normalizedValue * 3.0);
    } else if (normalizedValue < 0.66) {
        return mix(vis.colorMap[1], vis.colorMap[2], (normalizedValue - 0.33) * 3.0);
    } else {
        return mix(vis.colorMap[2], vis.colorMap[3], (normalizedValue - 0.66) * 3.0);
    }
}

void main() {
    float magnitude = 0.0;
    
    // Calculate tensor magnitude
    vec4 t1 = fragTensor1 * fragTensor1;
    vec4 t2 = fragTensor2 * fragTensor2;
    magnitude = sqrt(t1.x + t1.y + t1.z + t1.w +
                    t2.x + t2.y + t2.z + t2.w);
    
    // Get color based on visualization mode
    vec4 color;
    if (vis.colorMode == 0) {
        // Magnitude-based coloring
        color = getTensorColor(magnitude);
    } else if (vis.colorMode == 1) {
        // Component-based coloring
        color = vec4(
            abs(fragTensor1.x),
            abs(fragTensor1.y),
            abs(fragTensor1.z),
            1.0
        );
    } else {
        // Rank-based coloring
        float rank = fragMetadata.x;
        color = getTensorColor(rank);
    }
    
    // Apply opacity
    outColor = vec4(color.rgb, color.a * vis.opacity);
}
