export const SHADER_BUFFER = String.raw`// Buffer - @XorDev

//Overall brightness
#define BRIGHTNESS 0.3
//Base color
#define BASE 0.7
//Angular frequency
#define NUM 8.0
//Circular spin rate (radians per second)
#define SPIN 0.5
//Lighting turn rate (radians per second)
#define TURN 1.0
//Circle radius
#define RADIUS 0.6
//Falloff scale
#define FALL 4.0

//Capped hyperbolic tangent
vec3 tanh_cap(vec3 x)
{
    x = clamp(x, -4.0, 4.0);
    return -1.0 + 2.0 / (1.0 + exp(-2.0 * x));
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    //Centered, aspect correct coordinates
    vec2 p = (2.0 * fragCoord - iResolution.xy) / iResolution.y;
    //Circle distance field
    float circle = length(p) - RADIUS;
    //Angular repetition
    float ang = NUM * (atan(p.y, p.x) + SPIN * iTime);
    //Coloring from gradients
    vec3 hue = BASE + tanh_cap(vec3(-p, p.x));
    //Lighting
    float light = dot(p, cos(TURN * iTime + vec2(0.0, 2.0)));
    //Fog distance
    float fog = max(length(vec2(min(circle * FALL, circle) * FALL, cos(ang) - 0.9)), 0.0001);
    //Final lighting
    vec3 col = BRIGHTNESS * hue * light / fog;
    //Hyperbolic tonemapping
    fragColor = vec4(tanh_cap(col), 1.0);
}`;

export const SHADER_BITMAP = String.raw`// Bitmap - @XorDev

//Fractal layers
#define LAYERS 20
//Animation speed
#define SPEED 0.2

vec2 round2(vec2 v)
{
    return sign(v) * floor(abs(v) + 0.5);
}

void mainImage(out vec4 fragColor, in vec2 fragCoord)
{
    //Rounded, normalized coordinates
    vec2 p = (round2(fragCoord) - 0.5 * iResolution.xy) / iResolution.y;

    //Working coordinates
    vec2 v = vec2(0.0);
    vec2 aa = vec2(1.0 / iResolution.y);

    //Blend color (with alpha blending)
    vec4 col = vec4(0.0);

    //Fractal loop
    for(int i = 1; i <= LAYERS; i++)
    {
        //Double coordinates for next octave
        p += p;

        //Ceiling for grid cells
        v = ceil(p);

        //Edge blending (derivative-free approximation)
        float fi = float(i);
        col += vec4(aa.x, aa.y, aa.y, fract(length(v) / fi - iTime * SPEED)) * (1.0 - col.a);
    }

    //Output color
    fragColor = col;
}`;

export const SHADER_CENTRIFUGE = String.raw`// Centrifuge - @XorDev

//Overall brightness
#define BRIGHTNESS 5e-3
//Camera position
#define POS vec3(0, -7, 0)
//Field of view ratio
#define FOV 1.0
//Raymarch steps
#define STEPS 50
//Angular frequency scale
#define ANG_FREQ 10.0
//Z frequency scale
#define Z_FREQ 0.2
//Scroll speed
#define SCROLL 5.0
//Cylinder radius
#define RADIUS 11.0
//Cylinder thickness
#define THICKNESS 0.2
//Inner surface scale
#define INNER_SCALE 0.2
//Step scale
#define FACTOR 0.5
//RGB frequencies
#define COLOR_FREQ vec3(0.2, 0.0, 1.0 / 3.0)

vec3 tanh_cap(vec3 x)
{
    x = clamp(x, -4.0, 4.0);
    return -1.0 + 2.0 / (1.0 + exp(-2.0 * x));
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

    //Raymarch loop
    for(int i = 0; i < STEPS; i++)
    {
        //Raymarched sample point
        vec3 p = z * ray + POS;

        //Convert to cylindrical coordinates with animation
        vec3 cyl = vec3(
            atan(p.y, p.x) * ANG_FREQ + iTime,
            p.z * Z_FREQ - SCROLL * iTime,
            length(p.xy) - RADIUS
        );

        //Wavy modulation
        vec3 wave = cos(cyl + cos(cyl / INNER_SCALE)) - 1.0;

        //Cylinder shell with waves
        d = (length(vec4(cyl.z, wave)) - THICKNESS) * FACTOR;
        z += d;

        //Accumulate depth-based colored glow
        col += (1.2 - cos(p.z * COLOR_FREQ)) / max(abs(d), 0.0001);
    }

    //Hyperbolic tangent tonemapping
    fragColor = vec4(tanh_cap(col * BRIGHTNESS), 1.0);
}`;

export const SHADER_CUBIC = String.raw`// Cubic - @XorDev

//Overall brightness
#define BRIGHTNESS 1e-4
//Field of view ratio
#define FOV 1.0
//Velocity vector
#define VEL vec3(0,-1,-1)
//Raymarch steps
#define STEPS 100
//Wave frequency
#define WAVE_FREQ 5.0
//Hollow strength
#define HOLLOW 0.1
//Step scale
#define FACTOR 0.16
//Color frequency in y-axis
#define COL_FREQ 1.0
//RGB color phase shifts
#define RGB vec3(0, 2, 5)

vec3 tanh_cap(vec3 x)
{
    x = clamp(x, -4.0, 4.0);
    return -1.0 + 2.0 / (1.0 + exp(-2.0 * x));
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

    //Raymarch loop
    for(int i = 0; i < STEPS; i++)
    {
        //Raymarched sample point
        vec3 p = z * ray + VEL * iTime;

        //Nested cosine displacement
        vec3 v = cos(p + cos(p * WAVE_FREQ));

        //Cube distance
        d = FACTOR * length(max(v, v.yzx * HOLLOW));
        z += d;

        //Accumulate y-based colored glow
        col += (sin(COL_FREQ * p.y + RGB) + 1.0) / max(d, 0.0001);
    }

    //Hyperbolic tangent tonemapping
    fragColor = vec4(tanh_cap(col * BRIGHTNESS), 1.0);
}`;
