#version 450

// Inputs from vertex shader
layout(location = 0) in vec3 fragPosition;
layout(location = 1) in vec3 fragNormal;
layout(location = 2) in vec2 fragTexCoord;
layout(location = 3) in vec4 fragColor;

// Uniform buffer for lighting parameters
layout(set = 0, binding = 0) uniform LightingParams {
    vec3 lightPosition;
    vec3 viewPosition;
    vec3 lightColor;
    float ambientStrength;
    float specularStrength;
} lighting;

// Output color
layout(location = 0) out vec4 outColor;

void main() {
    // Ambient
    vec3 ambient = lighting.ambientStrength * lighting.lightColor;
    
    // Diffuse
    vec3 norm = normalize(fragNormal);
    vec3 lightDir = normalize(lighting.lightPosition - fragPosition);
    float diff = max(dot(norm, lightDir), 0.0);
    vec3 diffuse = diff * lighting.lightColor;
    
    // Specular
    vec3 viewDir = normalize(lighting.viewPosition - fragPosition);
    vec3 reflectDir = reflect(-lightDir, norm);
    float spec = pow(max(dot(viewDir, reflectDir), 0.0), 32);
    vec3 specular = lighting.specularStrength * spec * lighting.lightColor;
    
    // Final color
    vec3 result = (ambient + diffuse + specular) * fragColor.rgb;
    outColor = vec4(result, fragColor.a);
}
