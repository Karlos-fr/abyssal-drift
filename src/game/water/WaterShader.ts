export const WATER_VERTEX_SHADER = /* glsl */ `
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

export const WATER_FRAGMENT_SHADER = /* glsl */ `
  precision highp float;

  uniform sampler2D u_sceneTex;
  uniform float u_time;
  uniform vec2 u_worldOrigin;
  uniform vec2 u_worldSize;
  uniform vec2 u_worldExtent;
  uniform vec2 u_logicalSize;
  uniform float u_surfaceY;
  uniform float u_cameraDepth;
  uniform float u_touchUi;

  varying vec2 vUv;

  float hash11(float n) {
    return fract(sin(n * 127.1 + 17.37) * 43758.5453);
  }

  vec2 hash22(vec2 p) {
    p = vec2(
      dot(p, vec2(127.1, 311.7)),
      dot(p, vec2(269.5, 183.3))
    );
    return fract(sin(p) * 43758.5453);
  }

  float vnoise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(hash11(dot(i, vec2(1.0, 57.0))),
          hash11(dot(i + vec2(1.0, 0.0), vec2(1.0, 57.0))), u.x),
      mix(hash11(dot(i + vec2(0.0, 1.0), vec2(1.0, 57.0))),
          hash11(dot(i + vec2(1.0, 1.0), vec2(1.0, 57.0))), u.x),
      u.y
    );
  }

  float causticLayer(vec2 uv, float t) {
    vec2 i = floor(uv);
    vec2 f = fract(uv);
    float d1 = 9.0;
    float d2 = 9.0;

    for (int y = -1; y <= 1; y++) {
      for (int x = -1; x <= 1; x++) {
        vec2 g = vec2(float(x), float(y));
        vec2 o = hash22(i + g);
        vec2 r = g - f + 0.5 + 0.45 * sin(t + 6.28318 * o);
        float d = length(r);

        if (d < d1) {
          d2 = d1;
          d1 = d;
        } else if (d < d2) {
          d2 = d;
        }
      }
    }

    return smoothstep(0.13, 0.0, d2 - d1);
  }

  float surfaceWave(float worldX, float t) {
    return
      sin(worldX * 0.036 + t * 0.90) * 5.0 +
      sin(worldX * 0.061 - t * 0.53 + 1.8) * 2.4 +
      sin(worldX * 0.112 + t * 1.17 + 0.4) * 1.15;
  }

  vec3 bubbleContribution(vec2 world, float t, vec3 foamCol) {
    vec3 total = vec3(0.0);

    for (int i = 0; i < 14; i++) {
      float fi = float(i);
      float h1 = hash11(fi * 13.7 + 2.3);
      float h2 = hash11(fi * 29.1 + 7.1);
      float h3 = hash11(fi * 47.3 + 3.7);

      float bx =
        40.0 +
        h1 * (u_worldExtent.x - 80.0) +
        sin(t * 0.55 + h2 * 6.28318) * (3.0 + h3 * 8.0);

      float rise = fract(h2 * 71.0 + t * (0.035 + h1 * 0.055));
      float by = mix(u_worldExtent.y - 34.0, u_surfaceY + 8.0, rise);
      float radius = mix(1.2, 4.0, h3);

      float d = length(world - vec2(bx, by));
      float ring = smoothstep(radius, radius * 0.72, d) *
                   smoothstep(radius * 0.45, radius * 0.72, d);

      float highlight = smoothstep(
        radius * 0.42,
        0.0,
        length(world - vec2(bx - radius * 0.28, by - radius * 0.28))
      );

      total += foamCol * ring * 0.28;
      total += mix(foamCol, vec3(1.0), 0.45) * highlight * 0.23;
    }

    return total;
  }

  float touchUiMask(vec2 uv) {
    if (u_touchUi < 0.5) {
      return 0.0;
    }

    vec2 screenPx = vec2(
      uv.x * u_logicalSize.x,
      (1.0 - uv.y) * u_logicalSize.y
    );

    vec2 leftCenter = vec2(88.0, u_logicalSize.y - 72.0);
    vec2 rightCenter = vec2(u_logicalSize.x - 88.0, u_logicalSize.y - 72.0);

    float left = 1.0 - smoothstep(58.0, 68.0, length(screenPx - leftCenter));
    float right = 1.0 - smoothstep(52.0, 62.0, length(screenPx - rightCenter));
    return max(left, right);
  }

  void main() {
    vec2 uv = vUv;
    float t = u_time;

    vec2 world = vec2(
      u_worldOrigin.x + uv.x * u_worldSize.x,
      u_worldOrigin.y + (1.0 - uv.y) * u_worldSize.y
    );

    float wave = surfaceWave(world.x, t);
    float surfaceY = u_surfaceY + wave;
    float signedDepth = world.y - surfaceY;
    float underwater = smoothstep(-1.5, 2.5, signedDepth);
    float depth01 = clamp(signedDepth / 620.0, 0.0, 1.0);

    vec2 refractOffset = vec2(
      sin(world.y * 0.045 + t * 1.25) +
      sin(world.x * 0.021 - t * 0.72),
      cos(world.x * 0.031 - t * 0.88) +
      sin(world.y * 0.024 + t * 0.57)
    );

    float refractionStrength =
      (0.0008 + depth01 * 0.0018) *
      underwater *
      (0.65 + u_cameraDepth * 0.35);

    vec2 refractedUv = clamp(
      uv + refractOffset * refractionStrength,
      vec2(0.001),
      vec2(0.999)
    );

    vec3 source = texture2D(u_sceneTex, uv).rgb;
    vec3 refracted = texture2D(u_sceneTex, refractedUv).rgb;

    vec3 surfaceColor = vec3(0.10, 0.46, 0.61);
    vec3 deepColor = vec3(0.012, 0.065, 0.105);
    vec3 foamColor = vec3(0.63, 0.88, 0.95);

    vec3 waterColor = mix(surfaceColor, deepColor, depth01);
    vec3 submerged =
      refracted *
      mix(vec3(0.84, 0.96, 1.0), vec3(0.44, 0.72, 0.82), depth01);

    submerged = mix(
      submerged,
      waterColor,
      0.15 + depth01 * 0.28 + u_cameraDepth * 0.06
    );

    vec2 causticUv = world / 42.0;
    float ct = t * 0.72;
    float c1 = causticLayer(causticUv + vec2(ct * 0.11, ct * 0.07), ct);
    float c2 = causticLayer(
      causticUv * 1.37 - vec2(ct * 0.09, ct * 0.13) + 1.73,
      ct * 0.71
    );

    float caustics =
      clamp(c1 * 0.58 + c2 * 0.42, 0.0, 1.0) *
      (1.0 - depth01) *
      underwater;

    submerged += foamColor * caustics * 0.12;

    float rays = 0.0;
    for (int i = 0; i < 5; i++) {
      float fi = float(i);
      float h1 = hash11(fi * 7.13 + 1.8);
      float h2 = hash11(fi * 13.7 + 4.2);
      float rayX =
        fract(h1 + t * 0.0045 * (0.45 + h2 * 0.55)) *
        u_worldExtent.x;
      float tilt = (h2 - 0.5) * 0.24;
      float xTilted = world.x - tilt * max(signedDepth, 0.0);
      float widthPx = 24.0 + h1 * 22.0;
      float dx = abs(xTilted - rayX);
      float profile = exp(-(dx * dx) / (2.0 * widthPx * widthPx));
      float fade = (1.0 - depth01 * 0.85);
      float pulse = 0.55 + 0.45 * abs(sin(t * 0.7 + h1 * 6.28318));
      rays += profile * fade * pulse;
    }

    submerged += foamColor * rays * underwater * 0.018;

    float columnNoise = vnoise(vec2(
      world.x * 0.018 + t * 0.08,
      3.7
    ));
    submerged +=
      foamColor *
      pow(columnNoise, 3.4) *
      (1.0 - depth01 * 0.72) *
      underwater *
      0.035;

    float sparkLarge = vnoise(
      world / 130.0 + vec2(t * 0.025, -t * 0.016)
    );
    float sparkSmall = vnoise(
      world / 45.0 + vec2(-t * 0.037, t * 0.028)
    );
    float spark =
      pow(max(sparkLarge, 0.0), 4.0) * 0.7 +
      pow(max(sparkSmall, 0.0), 7.0) * 0.35;

    submerged +=
      foamColor *
      spark *
      (1.0 - depth01) *
      underwater *
      0.038;

    submerged += bubbleContribution(world, t, foamColor) * underwater;

    float foam =
      exp(-abs(signedDepth) * 0.34) *
      (0.66 + 0.34 * sin(world.x * 0.19 + t * 1.6));

    vec3 result = mix(source, submerged, underwater);
    result = mix(result, foamColor, clamp(foam, 0.0, 1.0) * 0.72);

    float underSurfaceGlow =
      exp(-max(signedDepth, 0.0) * 0.055) *
      underwater;
    result += foamColor * underSurfaceGlow * 0.025;

    if (touchUiMask(uv) > 0.5) {
      result = source;
    }

    gl_FragColor = vec4(result, 1.0);
  }
`;
