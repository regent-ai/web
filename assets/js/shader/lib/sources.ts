export const SHADER_W3DFWN_SHARD = String.raw`// Shard - @XorDev
// Directionally folded crystalline shard with sharp gyroid detail, bounded sphere, depth fade, and layered oscillating color bands

//Overall brightness
#define BRIGHTNESS 0.003
//Base brightness
#define BASE 0.7
//Camera position
#define POS vec3(0, 0, 8)
//Field of view ratio
#define FOV 1.0
//Raymarch steps
#define STEPS 100.0
//Sphere radius
#define RADIUS 5.0
//Spin rate
#define SPIN 0.25
//Shard bands
#define BANDS 3.3
//Step multiplier
#define GLOW 0.3
//Edge softness / base step
#define SOFTNESS 0.01

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    //Cumulative color
    vec3 col = vec3(0.0);
    //Raymarched depth
    float z = 0.0;
    //Raymarch step distance
    float d = 0.0;

    //Axis direction
    vec3 axis = normalize(cos(vec3(0, 2, 4) + SPIN * iTime));

    //Camera ray direction
    vec3 ray = normalize(vec3(fragCoord * 2.0 - iResolution.xy, -FOV * iResolution.y));

    //Raymarch loop
    for(float i = 0.0; i < STEPS; i++)
    {
        //Raymarched sample point
        vec3 p = z * ray + POS;

        //Rotate 90 degrees about the axis
        vec3 rot = axis * dot(axis, p) - cross(axis, p);

        //Irregular gyroid effect
        float gyroid = dot(cos(rot), sin(rot / 0.6).yzx);

        //High-frequency wave
        float band = sin(gyroid * BANDS);

        //Sphere distance
        float sphere = length(rot) - RADIUS;

        //Distance field
        float dist = abs(max(band, sphere) - i / 80.0);

        //Step distance
        d = SOFTNESS + GLOW * dist;
        z += d;

        //Add shading
        col += sin(i * 0.3) / d / z;
    }

    //Exponential tonemapping
    col = 1.0 - exp(-BASE - BRIGHTNESS * col);
    fragColor = vec4(col, 1.0);
}`;

export const SHADER_WXDFW4_ORB = String.raw`// Orb - @XorDev

//Overall brightness
#define BRIGHTNESS 0.0001
//Camera position
#define POS vec3(0,0,2)
//Field of view ratio
#define FOV 1.0
//Raymarch steps
#define STEPS 100
//Orb radius
#define RADIUS 1.0
//Twist strength
#define TWIST 1.0
//Glow attenuation
#define GLOW 0.2
//Inner density
#define DENSITY 0.1
//RGB color shift (in radians)
#define RGB vec3(6, 1, 3)
//Color wave frequency
#define COLOR_WAVE 2.5
//Color y-scale frequency
#define COLOR_Y 1.0
//Edge softness
#define SOFTNESS 0.03

//Half-pi for rotation
#define HPI 1.5707963268

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    //Cumulative color
    vec3 col = vec3(0.0);
    //Raymarched depth
    float z = 0.0;
    //Raymarch step distance
    float d = 0.0;

    //Camera ray direction
    vec3 ray = normalize(vec3(fragCoord * 2.0 - iResolution.xy, -FOV * iResolution.y));

    //Raymarch loop
    for(int i = 0; i < STEPS; i++)
    {
        //Raymarched sample point
        vec3 p = z * ray + POS;
        //Twist rotation
        p.zx *= mat2(cos(TWIST*p.y + iTime + vec4(0, -HPI, HPI, 0)));

        //Distance to sphere
        float sphere = length(p) - RADIUS;

        //Turbulence loop (WebGL1-safe: constant loop index pattern)
        for(int j = 0; j < 7; j++)
        {
            float f = exp2(float(j));
            p += sin(p.yzx * f) / f;
        }

        //Wavy distance
        float wave = cos(3.0 * p.y);

        //Step forward
        d = GLOW * max(SOFTNESS + DENSITY * abs(wave), sphere);
        z += d;

        // Accumulate colored glow
        col += (cos(COLOR_WAVE * wave + COLOR_Y * p.y + RGB) + 1.5) / d / z;
    }

    //Exponential tonemaping
    col = 1.0 - exp(-BRIGHTNESS * col);
    fragColor = vec4(col, 1.0);
}`;

export const SHADER_W3DBD4_IONIZE = String.raw`// Ionize - @XorDev

//Overall brightness
#define BRIGHTNESS 0.0006
//Camera position
#define POS vec3(0,0,9)
//Field of view ratio
#define FOV 1.0
//Raymarch steps
#define STEPS 100
//Outer shell radius
#define RADIUS 6.0
//Turbulence strength
#define TURB_STRENGTH 0.5
//Turbulence max frequency
#define TURB_MAX 9.0
//Edge softness
#define SOFTNESS 0.01

#define COLOR_FREQ 10.0
//RGB color shifts (radians)
#define RGB vec3(2,4,5)

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    //Cumulative color
    vec3 col = vec3(0.0);
    //Raymarched depth
    float z = 0.0;
    //Raymarch step distance
    float d = 0.0;

    //Camera ray direction (standard aspect-corrected with negative z for forward march)
    vec3 ray = normalize(vec3(fragCoord * 2.0 - iResolution.xy, -FOV * iResolution.y));

    //Raymarch loop
    for(int i = 0; i < STEPS; i++)
    {
        //Raymarched sample point
        vec3 p = z * ray + POS;

        //Sphere distance field
        float sphere = length(p) - RADIUS;

        //Turbulent displacement with time animation (WebGL1-safe: constant loop index pattern)
        for(int j = 0; j < 8; j++)
        {
            float f = exp2(float(j));
            if (f < TURB_MAX)
                p += TURB_STRENGTH * sin(p.yzx * f + iTime) / f;
        }

        //Irregular gyroid effect
        float gyroid = dot(cos(p), sin(p / .7).yzx);


        //Step distance: base + wave modulation - boundary adjustment, clamped to min step
        d = 0.2 * (SOFTNESS + abs(gyroid) + max(sphere, -0.1*sphere));
        z += d;

        //Accumulate colored glow with high-frequency wave, depth shift, and time animation
        col += (cos(gyroid * COLOR_FREQ + z + iTime + RGB) + 1.2) / d / z;
    }

    //Exponential tonemapping
    col = 1.0 - exp(-BRIGHTNESS * col);
    fragColor = vec4(col, 1.0);
}`;

export const SHADER_T3TFWN_ORBITAL = String.raw`// Orbital - @XorDev

//Overall brightness
#define BRIGHTNESS 0.0012
//Camera position
#define POS vec3(0,0,8.0)
//Field of view ratio
#define FOV 1.0
//Raymarch steps
#define STEPS 100
//Orbital ring radius
#define RADIUS 3.0
//Rotation speed (around Y axis)
#define SPIN 0.5
//Glow step factor (lower = more glow)
#define GLOW 0.1
//Edge softness
#define SOFTNESS 0.1
//RGB color phase shifts (radians)
#define COLOR_SHIFT vec3(4, 5, 7)

//Half-pi for rotation
#define HPI 1.5707963268

vec3 round3(vec3 v)
{
    return sign(v) * floor(abs(v) + 0.5);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    //Cumulative color
    vec3 col = vec3(0.0);
    //Raymarched depth
    float z = 0.0;
    //Raymarch step distance
    float d = 0.0;

    //Camera ray direction
    vec3 ray = normalize(vec3(fragCoord * 2.0 - iResolution.xy, -FOV * iResolution.y));

    //Rotation matrix
    mat2 rot = mat2(cos(SPIN * iTime + vec4(0, -HPI, HPI, 0)));

    //Raymarch loop
    for(int i = 0; i < STEPS; i++)
    {
        //Raymarched sample point
        vec3 p = z * ray + POS;

        //Apply slow Y-axis rotation
        p.xz *= rot;

        //Rounded into blocky coordinates (WebGL1-safe)
        vec3 block = round3(p + 0.6 * sin(p));

        //Irregular gyroid effect
        float gyroid = dot(cos(block), sin(block / 0.6).yzx);

        //Distance estimator: ring shell with crystalline modulation
        float dist = length(p) - RADIUS - gyroid;

        //Step distance with minimum offset for safety and glow
        d = GLOW * (SOFTNESS + abs(dist));
        z += d;

        //Accumulate depth-phased colored glow
        col += (cos(z + COLOR_SHIFT) + 1.0) / d / z;
    }

    //Exponential tonemapping
    col = 1.0 - exp(-BRIGHTNESS * col);
    fragColor = vec4(col, 1.0);
}`;

export const SHADER_WXDFWN_PHOSPHOR3 = String.raw`// Phosphor 3 - @XorDev
// Enhanced phosphor-glow folded sphere with directional transform, turbulent detail folding, trailing axis lag, wave-modulated shell density, and channel-phased coloring

//Overall brightness
#define BRIGHTNESS 0.0002
//Camera position
#define POS vec3(0,0,5)
//Field of view ratio
#define FOV 1.0
//Raymarch steps
#define STEPS 80
//Spin speed
#define SPIN 1.0
//Sphere radius
#define RADIUS 3.0
//Trailing effect strength
#define TRAIL 4.0
//Turbulence max frequency
#define TURB_MAX 9.0
//Turbulence speed
#define SPEED 1.0
//Glow step multiplier
#define GLOW 0.1
//Wave amplitude
#define WAVE_AMP 0.07
//RGB color phase shifts (radians)
#define RGB vec3(0, 1, 8)

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    //Cumulative color
    vec3 col = vec3(0.0);
    //Raymarched depth
    float z = 0.0;
    //Raymarch step distance
    float d = 0.0;

    //Camera ray direction
    vec3 ray = normalize(vec3(fragCoord * 2.0 - iResolution.xy, -FOV * iResolution.y));

    //Raymarch loop
    for(int i = 0; i < STEPS; i++)
    {
        //Raymarched sample point
        vec3 p = z * ray + POS;

        //Axis direction with trailing lag
        vec3 axis = normalize(cos(vec3(5, 0, 1) + SPIN * iTime - d * TRAIL));

        //Rotate 90 degrees about the axis
        vec3 rot = axis * dot(axis, p) - cross(axis, p);

        //Turbulence loop
        for(float f = 1.0; f < TURB_MAX; f += 1.0)
        {
            rot -= sin(rot * f + SPEED * iTime).zxy / f;
        }

        //Wave from y-component
        float waves = rot.y;

        //Raymarch hollow sphere
        d = GLOW * abs(length(p) - RADIUS) + WAVE_AMP * abs(cos(waves));
        z += d;

        //Accumulate phased color glow with depth fade
        col += (cos(waves + RGB) + 1.0) / d;
    }

    //Exponential tonemapping
    col = 1.0 - exp(-BRIGHTNESS * col);
    fragColor = vec4(col, 1.0);
}`;

export const SHADER_FLUTTER = String.raw`// Flutter - @XorDev

//Overall brightness
#define BRIGHTNESS 0.001
//Camera position
#define POS vec3(0,0,9)
//Field of view ratio
#define FOV 1.0
//Raymarch steps
#define STEPS 50
//Sphere radius
#define RADIUS 5.0
//Grid cell size
#define CELL 0.1
//Turbulence starting frequency
#define TURB_MIN 2.0
//Maximum frequency
#define TURB_MAX 8.0
//Wave speed
#define TURB_SPEED 1.0
//Step multiplier
#define FACTOR 0.1
//Edge softness
#define SOFTNESS 0.003

vec3 round3(vec3 v)
{
    return sign(v) * floor(abs(v) + 0.5);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    //Cumulative color
    vec3 col = vec3(0.0);
    //Raymarched depth
    float z = 0.0;
    //Raymarch step distance
    float d = 0.0;

    //Camera ray direction (unnormalized)
    vec3 ray = vec3((fragCoord * 2.0 - iResolution.xy) / iResolution.y / FOV, -1.0);

    //Raymarch loop
    for(int i = 0; i < STEPS; i++)
    {
        //Raymarched sample point
        vec3 p = z * ray + POS;

        //Blocky turbulence loop (WebGL1-safe: constant loop index pattern)
        for(int j = 0; j < 16; j++)
        {
            float f = TURB_MIN + float(j);
            if (f >= TURB_MAX)
                break;
            vec3 block = round3(p.zxy / CELL) * CELL;
            p += sin(block * f - TURB_SPEED * iTime) / f;
        }

        //Distance to the hollow sphere
        d = SOFTNESS + FACTOR * abs(length(p) - RADIUS);
        z += d;

        //Add coloring from the camera position
        col += (p / z + 0.8) / d;
    }

    //Hyperbolic tonemapping
    col = -1.0 + 2.0 / (1.0 + exp(-BRIGHTNESS * col));
    fragColor = vec4(col, 1.0);
}`;

export const SHADER_STORM = String.raw`// Storm - @XorDev

//Overall brightness
#define BRIGHTNESS 0.0002
//Camera position
#define POS vec3(0,0,7)
//Field of view ratio
#define FOV 1.0
//Raymarch steps
#define STEPS 100
//Step multiplier
#define FACTOR 0.1

//Sphere radius
#define RADIUS 4.0
//Sphere falloff rate
#define FALLOFF 10.0
//Pulsing rate
#define PULSE_RATE 10.0

//RGB color factors
#define COLOR vec3(0.2, 9.0, 2.0)
//RGB falloff exponents
#define EXP vec3(2, 1, 1)

//Turbulence starting frequency
#define TURB_MIN 1.0
//Maximum frequency
#define TURB_MAX 9.0
//Wave speed
#define TURB_SPEED 1.0

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    //Cumulative color
    vec3 col = vec3(0.0);
    //Raymarched depth
    float z = 0.0;
    //Raymarch step distance
    float d = 0.0;

    //Camera ray direction
    vec3 ray = normalize(vec3(fragCoord * 2.0 - iResolution.xy, -FOV * iResolution.y));

    //Raymarch loop
    for(int i = 0; i < STEPS; i++)
    {
        //Raymarched sample point
        vec3 p = POS + z * ray;

        //Spherical length
        float len = length(p);

        //Turbulence loop (WebGL1-safe: constant loop index pattern)
        vec3 wave = p;
        for(int j = 0; j < 16; j++)
        {
            float f = TURB_MIN + float(j);
            if (f >= TURB_MAX)
                break;
            wave += sin(wave * f - TURB_SPEED * iTime).yzx / f;
        }

        //Sphere distance
        float sph = min(len - RADIUS, (RADIUS - len) * FALLOFF);
        //Distortion waves
        vec3 dis = sin(wave.yzx / 3.0 + iTime);
        dis = 0.9 + sin(2.0 * len - PULSE_RATE * iTime + wave * dis);

        //Raymarch to this wavy sphere
        d = FACTOR * length(vec4(dis, 0.4 * sph));
        z += d;

        //Add color samples
        col += COLOR / pow(vec3(d), EXP);
    }

    //Hyperbolic tonemapping
    col = -1.0 + 2.0 / (1.0 + exp(-BRIGHTNESS * col));
    fragColor = vec4(col, 1.0);
}`;

export const SHADER_THERMAL = String.raw`// Thermal - @XorDev

//Overall brightness
#define BRIGHTNESS 0.004
//Camera position
#define POS vec3(0, 0, 5)
//Field of view
#define FOV 1.0
//Raymarch steps
#define STEPS 30
//Step multiplier
#define FACTOR 0.4
//Blocky modulation
#define MODULATION 0.5
//Box size
#define SIZE 2.0
//Turbulence min frequency
#define TURB_MIN 2.0
//Turbulence max frequency
#define TURB_MAX 7.0
//Turbulence speed
#define TURB_SPEED 1.0
//RGB phase shift (in radians)
#define RGB vec3(0, 1, 8)
//Color cycle rate
#define CYCLE 1.0

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    //Cumulative color
    vec3 col = vec3(0.0);
    //Raymarched depth
    float z = 0.0;
    //Camera ray direction
    vec3 ray = normalize(vec3(fragCoord * 2.0 - iResolution.xy, -FOV * iResolution.y));
    //Raymarch loop
    for(int i = 0; i < STEPS; i++)
    {
        //Raymarched sample point
        vec3 p = POS + z * ray;
        //Turbulence coordinate
        vec3 wave = p;
        //Turbulence loop (WebGL1-safe: constant loop index pattern)
        for(int j = 0; j < 16; j++)
        {
            float f = TURB_MIN + float(j);
            if (f >= TURB_MAX)
                break;
            wave -= sin(ceil(wave * f + TURB_SPEED * iTime)).yzx / f;
        }
        //Wave phase
        float s = wave.y + CYCLE * iTime;
        //Mirrored box coordinates
        vec3 a = abs(p);
        //Hollow distance to box
        float sph = abs(max(a.x, max(a.y, a.z)) - SIZE);
        //Step distance with modulation
        float d = FACTOR * (sph + MODULATION * abs(cos(s)));
        //Advance ray
        z += d;
        //Add color samples
        col += (cos(s - iTime + RGB) + 1.0) / d;
    }
    //Hyperbolic tonemapping
    col = 1.0 - exp(-col * BRIGHTNESS);
    fragColor = vec4(col, 1.0);
}`;

export const SHADER_RADIANT2 = String.raw`// Radiant 2 - @XorDev

//Overall brightness
#define BRIGHTNESS 0.006
//Camera position
#define POS vec3(0, 0, 9)
//Field of view
#define FOV 1.0
//Raymarch steps
#define STEPS 50.0
//Step multiplier
#define FACTOR 0.125
//Block separation
#define SEPARATION 0.9
//Sphere density
#define DENSITY 1.6
//Sphere radius
#define RADIUS 4.0
//Wave frequency
#define WAVE_FREQ 15.0
//Wave speed
#define WAVE_SPEED 1.0
//Rotation speed
#define SPIN 1.0
//Axis offsets in radians
#define AXIS_PHASES vec3(0, 3, 0)
//RGB phase offsets
#define PHASES vec3(6, 1, 2)
//Color frequency
#define COLOR 0.1

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    //Cumulative color
    vec3 col = vec3(0.0);
    //Raymarched depth
    float z = 0.0;
    //Camera ray direction
    vec3 ray = normalize(vec3(fragCoord * 2.0 - iResolution.xy, -FOV * iResolution.y));

    //Raymarch loop (WebGL1-safe: constant loop index pattern)
    for(int j = 0; j < 64; j++)
    {
        float i = float(j);
        if (i >= STEPS)
            break;

        //Raymarched sample point
        vec3 p = POS + z * ray;
        //Rotation axis
        vec3 axis = normalize(cos(SPIN * iTime + AXIS_PHASES));
        //Rotate 90 degrees
        p = dot(axis, p) * axis + cross(axis, p);

        //Length for sphere
        float l = max(length(p), 0.0001);
        //Distance to hollow sphere
        float sph = abs(l - RADIUS);

        //Sine waves
        vec3 w = sin(abs(p) / l * WAVE_FREQ + WAVE_SPEED * iTime);
        //Step distance
        float d = FACTOR * (sph + DENSITY * length(max(w, w.yzx) - SEPARATION));
        z += d;
        //Add color samples with intensity falloff
        col += (cos(COLOR * i + iTime + PHASES) + 1.0) / d / z;
    }
    //Hyperbolic tonemapping
    col = 1.0 - exp(-col * BRIGHTNESS);
    fragColor = vec4(col, 1.0);
}`;

export const SHADER_ROCAILLE = String.raw`// Rocaille - @XorDev

//Overall brightness
#define BRIGHTNESS 0.028
//Scale factor
#define SCALE 0.3
//Accumulation steps
#define STEPS 10.0
//Layer offset
#define OFFSET 1.0
//Color shift
#define COLOR 1.0
//RGB phase offsets
#define RGB vec3(0, 1, 2)

//Turbulence frequency
#define TURB_MAX 9.0
//Turbulence speed
#define TURB_SPEED 1.0

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    //Cumulative color
    vec3 col = vec3(0.0);
    //Centered, aspect-correct, scaled coordinates
    vec2 p = (2.0 * fragCoord - iResolution.xy) / iResolution.y / SCALE;

    //Layer loop (WebGL1-safe: constant loop index pattern)
    for(int j = 0; j < 32; j++)
    {
        float i = float(j);
        if (i >= STEPS)
            break;

        //Turbulence coordinates
        vec2 wave = p;
        //Turbulence loop (WebGL1-safe: constant loop index pattern)
        for(int k = 0; k < 16; k++)
        {
            float f = 1.0 + float(k);
            if (f >= TURB_MAX)
                break;
            wave += sin(wave.yx * f + OFFSET * i + TURB_SPEED * iTime) / f;
        }
        //Add color samples
        col += (cos(COLOR * i + RGB) + 1.0) / max(length(wave), 0.0001);
    }
    //Exponential tonemapping
    col = 1.0 - exp(-BRIGHTNESS * col * col);
    fragColor = vec4(col, 1.0);
}`;

export const SHADER_WELL = String.raw`// Well - @XorDev

//Overall brightness
#define BRIGHTNESS 0.1
//Zoom factor
#define SCALE 0.3
//Accumulation steps
#define STEPS 9.0

//Color shift for each layer
#define COLOR_SHIFT 0.333
//RGB phase offsets (radians)
#define RGB vec3(1, 2, 3)
//Bloom scatter scale
#define BLOOM 0.04

//Ball radius
#define RADIUS 5.0
//Curvature strength
#define CURVE 2.0
//Turbulence frequencies
#define TURB_FREQ 9.0
//Turbulence speed
#define TURB_SPEED 0.5

//Capped hyperbolic tangent
vec3 tanh_cap(vec3 x)
{
    x = clamp(x, -4.0, 4.0);
    return -1.0 + 2.0 / (1.0 + exp(-2.0 * x));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    //Cumulative color
    vec3 col = vec3(0.0);
    //Normalized coordinates
    vec2 p = (fragCoord * 2.0 - iResolution.xy) / iResolution.y / SCALE;

    //Layer loop (WebGL1-safe: constant loop index pattern)
    for(int j = 0; j < 32; j++)
    {
        float i = float(j);
        if (i >= STEPS)
            break;

        //Turbulence coordinate
        vec2 wave = p;
        //Turbulence loop (WebGL1-safe: constant loop index pattern)
        for(int k = 0; k < 16; k++)
        {
            float f = 1.0 + float(k);
            if (f >= TURB_FREQ)
                break;
            wave += sin(ceil(wave.yx * f + 0.3 * i) + vec2(0.0, 2.0) - iTime / TURB_SPEED) / f;
        }
        //Distance to the distorted ball
        float d = dot(p, p) - RADIUS - CURVE / max(wave.y, 0.0001);
        //Add color samples
        col += BRIGHTNESS / max(abs(d), 0.0001) * (cos(COLOR_SHIFT * i + 0.1 / d + RGB) + 1.0);
    }
    //Dithered bloom coordinates
    vec2 dith = (fragCoord + iResolution.y * BLOOM * sin(fragCoord + fragCoord.yx / 0.6)) / iResolution.xy;
    //Use channel 0 for bloom carry
    vec3 prev = texture2D(iChannel0, dith).rgb;
    //Combine and tonemap
    col = tanh_cap(col + prev * col);
    //Clamp to positive
    col = max(col, 0.0);
    fragColor = vec4(col, 1.0);
}`;

export const SHADER_MAGNETIC = String.raw`// Magnetic - @XorDev

//Overall brightness
#define BRIGHTNESS 1e6
//Camera position
#define POS vec3(0, 0, 5)
//Field of view
#define FOV 1.0
//Raymarch steps
#define STEPS 60
//Step factor
#define FACTOR 0.16
//Turbulence min frequency
#define TURB_MIN 1.0
//Turbulence max frequency
#define TURB_MAX 9.0
//Turbulence speed
#define TURB_SPEED 1.0

vec3 round3(vec3 v)
{
    return sign(v) * floor(abs(v) + 0.5);
}

vec4 tanh_cap4(vec4 x)
{
    x = clamp(x, -4.0, 4.0);
    return -1.0 + 2.0 / (1.0 + exp(-2.0 * x));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    //Cumulative color
    vec4 col = vec4(0.0);
    //Raymarched depth
    float z = 0.0;
    //Camera ray direction
    vec3 ray = normalize(vec3(fragCoord * 2.0 - iResolution.xy, -FOV * iResolution.y));
    //Raymarch loop
    for(int i = 0; i < STEPS; i++)
    {
        //Raymarched sample point
        vec3 p = z * ray;
        //Turbulence coordinate
        vec3 a = p - 0.9 * p.xzy;

        p += POS;

        //Turbulence loop (WebGL1-safe: constant loop index pattern)
        for(int j = 0; j < 16; j++)
        {
            float f = TURB_MIN + float(j);
            if (f >= TURB_MAX)
                break;
            a += sin(round3(a * f).yzx + TURB_SPEED * iTime) / f;
        }
        //Spherical length
        float l = max(length(p), 0.0001);
        //Step distance
        float d = FACTOR * length(vec4(sin(a * a) * 0.3, cos(l / 0.3)));
        z += d;
        //Add color samples
        col += vec4(l, 2.0, z, 1.0) / d / l / z;
    }
    //Hyperbolic tonemapping
    col = tanh_cap4(col * col / BRIGHTNESS);
    fragColor = col;
}`;

export const SHADER_SINGULARITY = String.raw`// Singularity - @XorDev

//UV zoom
#define ZOOM 0.7
//Gravitational lens strength
#define GRAV 5.0
//Lens softness
#define GRAV_SOFT 0.1
//Lens offset direction
#define GRAV_DIR vec2(-1, 1)
//Rotation speed
#define SPIN 0.2
//Log-polar rotation phases
#define ROT_PHASE vec4(0, 33, 11, 0)
//Spiral scale
#define SPIRAL 5.0
//Turbulence min frequency
#define TURB_MIN 1.0
//Turbulence max frequency
#define TURB_MAX 9.0
//Turbulence amplitude
#define TURB_AMP 0.7
//Turbulence bias
#define TURB_BIAS 0.5
//X-axis color tint
#define COLOR vec4(0.6, -0.4, -1.0, 0.0)
//Disk wave scale
#define DISK_WAVE 0.3
//Disk wave mix
#define DISK_MIX 0.2
//Disk mask tightness
#define DISK_TIGHT 0.1
//Gaussian falloff strength
#define GAUSS 7.0
//Gaussian y-shift
#define GAUSS_SHIFT 0.3
//Event horizon radius
#define HORIZON 0.7
//Horizon sharpness
#define HORIZON_SOFT 0.03
//Overall brightness
#define BRIGHTNESS 0.2

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    //Centered, aspect-corrected UV with zoom
    vec2 p = (fragCoord * 2.0 - iResolution.xy) / iResolution.y / ZOOM;

    //Lens direction
    vec2 dir = GRAV_DIR;

    //Gravitational lensing distortion
    vec2 offset = GRAV * p - dir;
    float g = 1.0 / (GRAV_SOFT + GRAV / dot(offset, offset));
    vec2 c = p * mat2(1.0, 1.0, dir * g);

    //Log-polar spiral rotation
    vec2 v = c * mat2(cos(log(length(c)) + iTime * SPIN + ROT_PHASE)) * SPIRAL;

    //Cumulative glow
    vec4 col = vec4(0.0);

    //Turbulence loop accumulate glow (WebGL1-safe: constant loop index pattern)
    for(int j = 0; j < 16; j++)
    {
        float i = TURB_MIN + float(j);
        if (i > TURB_MAX)
            break;
        v += TURB_AMP * sin(v.yx * i + iTime) / i + TURB_BIAS;
        col += sin(v.xyyx) + 1.0;
    }

    //Accretion disk ring mask
    float disk = DISK_TIGHT + DISK_TIGHT * pow(length(sin(v / DISK_WAVE) * DISK_MIX + c * vec2(1.0, 2.0)) - 1.0, 2.0);

    //Gaussian falloff from center
    float gauss = 1.0 + GAUSS * exp(GAUSS_SHIFT * c.y - dot(c, c));

    //Event horizon ring highlight
    float horizon = HORIZON_SOFT + abs(length(p) - HORIZON);

    //Final color: exponential glow divided by all masks
    fragColor = 1.0 - exp(-exp(c.x * COLOR) / max(col, vec4(0.0001)) / disk / gauss / horizon * BRIGHTNESS);
}`;

export const SHADER_LAPSE = String.raw`// Lapse - @XorDev

//Overall brightness
#define BRIGHTNESS 1e-4
//Field of view ratio
#define FOV 1.0
//Camera position
#define POS vec3(0, 0, 5)
//Normalized rotation axis
#define AXES vec3(0, 1, 0)
//Rotation speed
#define SPIN 1.0
//Raymarch steps
#define STEPS 50.0
//Turbulence min frequency
#define TURB_MIN 1.0
//Turbulence max frequency
#define TURB_MAX 9.0
//Step scale
#define FACTOR 0.1

vec3 round3(vec3 v)
{
    return sign(v) * floor(abs(v) + 0.5);
}

vec4 tanh_cap4(vec4 x)
{
    x = clamp(x, -4.0, 4.0);
    return -1.0 + 2.0 / (1.0 + exp(-2.0 * x));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    //Cumulative color
    vec4 col = vec4(0.0);
    //Raymarched depth
    float z = 0.0;
    //Raymarch step distance
    float d = 0.0;

    //Camera ray direction
    vec3 ray = normalize(vec3(fragCoord * 2.0 - iResolution.xy, -FOV * iResolution.y));

    //Raymarch loop (WebGL1-safe: constant loop index pattern)
    for(int j = 0; j < 64; j++)
    {
        float i = float(j);
        if (i >= STEPS)
            break;

        //Raymarched sample point
        vec3 p = z * ray + POS;

        //Radial distance minus time (expanding wave)
        float h = length(p) - SPIN * iTime;

        //Axis rotation
        vec3 a = mix(dot(AXES, p) * AXES, p, sin(h)) + cos(h) * cross(AXES, p);

        //Rounded crystalline turbulence (WebGL1-safe: constant loop index pattern)
        for(int k = 0; k < 16; k++)
        {
            float f = TURB_MIN + float(k);
            if (f > TURB_MAX)
                break;
            a += sin(round3(a * f) - iTime).zxy / f;
        }

        //Distance from xz magnitude
        d = FACTOR * length(a.xz);
        z += d;

        //Accumulate colored glow (depth and iteration tinted)
        col += vec4(3.0, z, float(i) + 1.0, 1.0) / d;
    }

    //Hyperbolic tangent tonemapping
    fragColor = tanh_cap4(col * BRIGHTNESS);
}`;

export const SHADER_FLARE = String.raw`// Flare - @XorDev

//Total brightness
#define BRIGHTNESS 3e-3
//Flash rate
#define FLASH 1.0

//Number of points
#define POINTS 50.0

//Orientation and scale
#define ORIENT mat2(9, -2, 2, 9)
//Oscillation amplitude
#define RADIUS 3.0

#define SPIN 1.0

//Trail falloff rate
#define TRAIL 0.03
//Trail noise scale
#define TRAIL_SCALE 1.0
//Trail movement speed
#define TRAIL_SPEED 4.0

//Color palette frequencies
#define PALETTE vec3(7, 4, 2)
//Y-axis glare effect
#define GLARE 5.0
//Gamma exponent
#define GAMMA 1.5

//Simple 2D value noise
float noise2D(vec2 p)
{
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);

    float a = fract(sin(dot(i, vec2(127.1, 311.7))) * 43758.5453);
    float b = fract(sin(dot(i + vec2(1.0, 0.0), vec2(127.1, 311.7))) * 43758.5453);
    float c = fract(sin(dot(i + vec2(0.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);
    float d = fract(sin(dot(i + vec2(1.0, 1.0), vec2(127.1, 311.7))) * 43758.5453);

    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    //Centered, aspect-corrected UV with rotation/scale
    vec2 p = (fragCoord - 0.5 * iResolution.xy) / iResolution.y * ORIENT;

    //Working position
    vec2 v;

    //Cumulative color
    vec3 col = vec3(0.0);

    //Line accumulation loop (WebGL1-safe: constant loop index pattern)
    for(int j = 1; j <= 128; j++)
    {
        float i = float(j);
        if (i > POINTS)
            break;

        //Point coordinates on the ring
        v = p + RADIUS * cos(i * i + SPIN * iTime + TRAIL * p.x + vec2(0.0, 11.0));

        //Trail coordinates
        vec2 tp = TRAIL_SCALE * (p + vec2(TRAIL_SPEED * iTime, i));
        //Trailing rates in fog
        vec2 trailing = v * vec2(TRAIL * (0.5 + noise2D(tp)), 1.0 / GLARE);
        //Flash brightness
        float flash = exp(sin(i * i + FLASH * iTime));
        //Attenuate in fog
        float light = flash / length(max(v, trailing));
        //Add color samples
        col += light * (cos(sin(i) * PALETTE) + 1.0);
    }

    //Gamma-adjusted exponential tonemapping
    col = 1.0 - exp(-pow(col * BRIGHTNESS, vec3(GAMMA)));
    fragColor = vec4(col, 1.0);
}`;

export const SHADER_OBSERVER = String.raw`// Observer - @XorDev

//Overall brightness
#define BRIGHTNESS 0.03
//Zoom factor
#define SCALE 0.2
//Accumulation steps
#define STEPS 10.0

//Color rate per layer
#define COLOR_SHIFT 0.4
//RGB phase offsets (radians)
#define PHASES vec3(0,1,2)
//Bloom scatter scale
#define BLOOM 0.05

//Inside falloff
#define FALLOFF 3.0
//Turbulence offset per layer
#define TURB_OFFSET 0.9
//Turbulence max frequency
#define TURB_FREQ 9.0
//Turbulence speed
#define TURB_SPEED 0.5

vec3 tanh_cap(vec3 x)
{
    x = clamp(x, -4.0, 4.0);
    return -1.0 + 2.0 / (1.0 + exp(-2.0 * x));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    //Cumulative color
    vec3 col = vec3(0.0);
    //Normalized coordinates
    vec2 p = (fragCoord * 2.0 - iResolution.xy) / iResolution.y / SCALE;
    //Layer loop (WebGL1-safe: constant loop index pattern)
    for(int j = 0; j < 32; j++)
    {
        float i = float(j);
        if (i >= STEPS)
            break;

        //Turbulence coordinate
        vec2 wave = p;
        //Turbulence loop (WebGL1-safe: constant loop index pattern)
        for(int k = 0; k < 16; k++)
        {
            float f = 1.0 + float(k);
            if (f >= TURB_FREQ)
                break;
            wave += sin(ceil(wave * f + TURB_OFFSET * i) - iTime / TURB_SPEED) / f;
        }
        //Distance to layered spheres (preserve signed structure with epsilon guard)
        float l = length(wave) - i;
        float lSafe = sign(l) * max(abs(l), 0.0001);
        float d = max(lSafe, -lSafe * FALLOFF);
        //Add color samples
        col += BRIGHTNESS / max(abs(d), 0.0001) * (cos(iTime - COLOR_SHIFT * i + 0.1 / lSafe + PHASES) + 1.1);
    }
    //Dithered bloom coordinates
    vec2 dith = (fragCoord + iResolution.y * BLOOM * sin(fragCoord + fragCoord.yx / 0.6)) / iResolution.xy;
    //Use channel 0 for bloom carry when available
    vec3 prev = texture2D(iChannel0, dith).rgb;
    //Fallback feedback when channel 0 is the default black texture
    float prevEnergy = dot(prev, prev);
    vec3 syntheticPrev = 0.25 + 0.25 * cos(vec3(0.0, 2.0, 4.0) + iTime + 25.0 * dith.xyx);
    prev = mix(syntheticPrev, prev, step(1e-5, prevEnergy));
    //Combine and tonemap
    col = tanh_cap(col + prev * col);
    //Clamp to positive
    col = max(col, 0.0);
    fragColor = vec4(col, 1.0);
}`;
