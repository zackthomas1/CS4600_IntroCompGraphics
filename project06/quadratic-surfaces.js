let quadraticFS = `
    struct Ray {
        vec3 pos;
        vec3 dir;
    };

    struct Material {
        vec3  k_d;	// diffuse coefficient
        vec3  k_s;	// specular coefficient
        float n;	// specular exponent
    };

    struct Light {
        vec3 position;
        vec3 intensity;
    };

    struct HitInfo {
        float    t;
        vec3     position;
        vec3     normal;
        Material mtl;
    };

    uniform Light  lights [ NUM_LIGHTS  ];
    uniform samplerCube envMap;
    uniform int bounceLimit;

    struct Cyclinder{
        vec3    center;
        float   radius;
        float	zMin;
        float 	zMax; 
        Material mtl;
    };
    bool IntersectRayCyclinder(inout HitInfo hit, Ray ray) {
        Cyclinder c1; 
        c1.center = vec3(0.0, 0.0, 0.0); 
        c1.radius = 1.0; 
        c1.zMin = -1.0; 
        c1.zMax = 1.0;
    
        c1.mtl.k_d = vec3(0.75,0.5,0.25); 
        c1.mtl.k_s = vec3(0.5,0.5,0.5); 
        c1.mtl.n = 220.0;
    
        hit.t = 1e30;
        bool foundHit = false;
    
        float a = pow(ray.dir.x,2.0) + pow(ray.dir.y,2.0); 
        float b = 2.0 * ((ray.dir.x * ray.pos.x) + (ray.dir.y * ray.pos.y));
        float c = pow(ray.pos.x, 2.0) + pow(ray.pos.y, 2.0) - pow(c1.radius, 2.0);
    
        float discriminant = pow(b, 2.0) - (4.0*a*c);
    
        if(discriminant >= 0.0){
            float t0 =( -b - sqrt(discriminant)) / (2.0 * a) ;
            vec3 position =  (ray.pos + (ray.dir * t0)); 
    
            if(position.z >= c1.zMin && position.z <=c1.zMax){
                if(t0 > 0.0 && t0 <= hit.t){
    
                    hit.t = t0; 
                    hit.position = position ;
                    hit.normal = normalize(2.0 * (hit.position - c1.center)); 
                    hit.mtl = c1.mtl;
        
                    foundHit = true; 
                }
            }
        }
        return foundHit; 
    }
    
    vec4 RayTracerCylinder( Ray ray ){
        HitInfo hit; 
        if(IntersectRayCyclinder(hit, ray)){
            vec3 view = normalize( -ray.dir );
            // vec3 clr = hit.normal; // test
            vec3 clr = Shade( hit.mtl, hit.position, hit.normal, view );
            return vec4(clr,1.0);
        }else{
            return vec4( textureCube( envMap, ray.dir.xzy ).rgb, 0 );	// return the environment color
        }
    }
    
    struct Paraboliod{
        vec3 radius; 
        float zMax;
        Material mtl; 
    };
    
    bool IntersectRayParaboliod(inout HitInfo hit, Ray ray){
    
        Paraboliod p1; 
        p1.radius = vec3(3.0,1.0,1.0);
        p1.zMax = 2.0;
    
        p1.mtl.k_d = vec3(0.5,0.5,0.5); 
        p1.mtl.k_s = vec3(0.5,0.5,0.5); 
        p1.mtl.n = 200.0;
    
        hit.t = 1e30;
        bool foundHit = false;
    
        float a = (pow(p1.radius.y,2.0)*p1.radius.z*pow(ray.dir.x,2.0))+
                    (pow(p1.radius.x,2.0)*p1.radius.y*pow(ray.dir.y,2.0)); 
        float b = (2.0*pow(p1.radius.y,2.0)*p1.radius.z*ray.pos.x*ray.dir.x)+
                    (2.0*pow(p1.radius.x,2.0)*p1.radius.z*ray.pos.y*ray.dir.y)+
                    (pow(p1.radius.x,2.0)*pow(p1.radius.y,2.0)*ray.dir.z); 
        float c = (pow(p1.radius.y,2.0)*p1.radius.z*pow(ray.pos.x,2.0))+
                    (pow(p1.radius.x,2.0)*p1.radius.z*pow(ray.pos.y,2.0))-
                    (pow(p1.radius.x,2.0)*pow(p1.radius.y,2.0)*ray.pos.z);
    
        float discriminant = pow(b, 2.0) - (4.0*a*c);
        if(discriminant >= 0.0){
            float t0 =( -b - sqrt(discriminant)) / (2.0 * a) ;
            vec3 position =  (ray.pos + (ray.dir * t0)); 
    
            if(abs(position.z) <=p1.zMax){
                if(t0 > 0.0 && t0 <= hit.t){
    
                    hit.t = t0; 
                    hit.position = position ;
                    // hit.normal = normalize(2.0 * (hit.position - c1.center)); 
                    hit.mtl = p1.mtl;
        
                    foundHit = true; 
                }
            }
        }
        return foundHit; 
    }
    
    vec4 RayTracerParaboliod( Ray ray){
        HitInfo hit; 
        if(IntersectRayParaboliod(hit, ray)){
            vec3 view = normalize( -ray.dir );
            vec3 clr = vec3(0.8,0.5,0.0); // test
            return vec4(clr,1.0);
        }else{
            return vec4( textureCube( envMap, ray.dir.xzy ).rgb, 0 );	// return the environment color
        }
    }
    
`