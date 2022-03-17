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
    
    struct Sphere {
        vec3     center;
        float    radius;
        Material mtl;
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

    uniform Sphere spheres[ NUM_SPHERES ];
    uniform Light  lights [ NUM_LIGHTS  ];
    uniform samplerCube envMap;
    uniform int bounceLimit;

    bool IntersectShadowRay(Ray ray){
	
        bool foundHit = false;
        for ( int i=0; i<NUM_SPHERES; ++i ) {
            Sphere sphere = spheres[i];
    
            // TO-DO: Test for ray-sphere intersection
            float discriminant = pow(dot(ray.dir, (ray.pos - sphere.center)), 2.0) - 
                (dot(ray.dir, ray.dir) * (dot((ray.pos - sphere.center), (ray.pos - sphere.center)) - pow(sphere.radius, 2.0))); 
    
            if(discriminant >= 0.0){
                foundHit = true; 
            }
    
            // find the t value of closet ray-sphere intersection
            float tVal = ((-1.0 * dot(ray.dir, (ray.pos-sphere.center))) - sqrt(discriminant)) / (dot(ray.dir, ray.dir));
            if(tVal < 0.0){
                foundHit = false;
            }
            
            if(foundHit){
                return foundHit;
            }	
        }
        return foundHit;
    }
    
    // Intersects the given ray with all spheres in the scene
    // and updates the given HitInfo using the information of the sphere
    // that first intersects with the ray.
    // Returns true if an intersection is found.
    bool IntersectRay( inout HitInfo hit, Ray ray )
    {
        hit.t = 1e30;
        bool foundHit = false;
    
        for ( int i=0; i<NUM_SPHERES; ++i ) {
            Sphere sphere = spheres[i];
    
            // TO-DO: Test for ray-sphere intersection
            float discriminant = pow(dot(ray.dir, (ray.pos - sphere.center)), 2.0) - 
                (dot(ray.dir, ray.dir) * (dot((ray.pos - sphere.center), (ray.pos - sphere.center)) - pow(sphere.radius, 2.0))); 
    
            if(discriminant >= 0.0){ // hit found
    
                // find the t value of closet ray-sphere intersection
                float t0 = (-(dot(ray.dir, (ray.pos-sphere.center))) - sqrt(discriminant)) / (dot(ray.dir, ray.dir));
    
                // TO-DO: If intersection is found, update the given HitInfo
                if( t0 > 0.0 && t0 <= hit.t){
                    foundHit = true;
    
                    hit.t = t0; 
                    hit.position = ray.pos + (ray.dir * t0) ; 
                    hit.normal = normalize((hit.position - sphere.center)/sphere.radius); 
        
                    hit.mtl = sphere.mtl;
                }	
            }
        }
        return foundHit;
    }

    // Shades the given point and returns the computed color.
    vec3 Shade( Material mtl, vec3 position, vec3 normal, vec3 view )
    {
        float eplison = 0.003;
        vec3 ambientComponent = mtl.k_d * 0.05;
        vec3 color;
        normal = normalize(normal);
    
        for ( int i=0; i<NUM_LIGHTS; ++i ) {
            
            // TO-DO: Check for shadows
            Ray surfaceToLightRay; 
            surfaceToLightRay.dir = normalize(lights[i].position - position);
            surfaceToLightRay.pos = position + (surfaceToLightRay.dir) * eplison;  
    
            if( IntersectShadowRay(surfaceToLightRay) ){
                // color += vec3(1.0,0.0,0.0);	// Test Shadows
                color += ambientComponent;
            }else{
                // TO-DO: If not shadowed, perform shading using the Blinn model
                vec3 lightDir = normalize((lights[i].position - position));
                float cosTheta = dot(normal, lightDir);
                vec3 diffuseComponent = mtl.k_d * lights[i].intensity * max(0.0, cosTheta); 
                
                vec3 halfAngle = normalize(view + lightDir);
                vec3 specularComponent = mtl.k_s * lights[i].intensity * pow(max(0.0, dot(normal, halfAngle)),mtl.n); 
                
                color += ambientComponent + diffuseComponent + specularComponent;	// change this line	
            }
        }
        return color;
    }

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
            vec3 clr = hit.normal; // test
            // vec3 clr = Shade( hit.mtl, hit.position, hit.normal, view );
            return vec4(clr,1.0);
        }else{
            return vec4( textureCube( envMap, ray.dir.xzy ).rgb, 0 );	// return the environment color
        }
    }
    
    struct Paraboloid{
        vec3 radius; 
        float zMax;
        Material mtl; 
    };
    
    bool IntersectRayParaboloid(inout HitInfo hit, Ray ray){
    
        Paraboloid p1; 
        p1.radius = vec3(1.0,1.0,1.0);
        p1.zMax = 2.0;
    
        p1.mtl.k_d = vec3(0.5,0.5,0.5); 
        p1.mtl.k_s = vec3(0.5,0.5,0.5); 
        p1.mtl.n = 200.0;
    
        hit.t = 1e30;
        bool foundHit = false;
    
        float a = (pow(p1.radius.y,2.0)*p1.radius.z*pow(ray.dir.x,2.0))+
                    (pow(p1.radius.x,2.0)*p1.radius.y*pow(ray.dir.y,2.0)); 
        float b = (2.0*pow(p1.radius.y,2.0)*p1.radius.z*ray.pos.x*ray.dir.x)+
                    (2.0*pow(p1.radius.x,2.0)*p1.radius.z*ray.pos.y*ray.dir.y)-
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
    
    vec4 RayTracerParaboloid( Ray ray){
        HitInfo hit; 
        if(IntersectRayParaboloid(hit, ray)){
            vec3 view = normalize( -ray.dir );
            vec3 clr = hit.position; // test
            return vec4(clr,1.0);
        }else{
            return vec4( textureCube( envMap, ray.dir.xzy ).rgb, 0 );	// return the environment color
        }
    }

    struct HyperbolicParaboloid{
        vec3 radius; 
        vec3 bounds;
        Material mtl; 
    };
    
    bool IntersectRayHyperbolicParaboloid(inout HitInfo hit, Ray ray){
    
        HyperbolicParaboloid hp1; 
        hp1.radius = vec3(2.0,1.0,1.0);
        hp1.bounds = vec3(3.0,2.0,2.0);
    
        hp1.mtl.k_d = vec3(0.5,0.5,0.5); 
        hp1.mtl.k_s = vec3(0.5,0.5,0.5); 
        hp1.mtl.n = 200.0;
    
        hit.t = 1e30;
        bool foundHit = false;
    
        float a = (pow(hp1.radius.y,2.0)*hp1.radius.z*pow(ray.dir.x,2.0))-
                    (pow(hp1.radius.x,2.0)*hp1.radius.y*pow(ray.dir.y,2.0)); 

        float b = (2.0*pow(hp1.radius.y,2.0)*hp1.radius.z*ray.pos.x*ray.dir.x)-
                    (2.0*pow(hp1.radius.x,2.0)*hp1.radius.z*ray.pos.y*ray.dir.y)-
                    (pow(hp1.radius.x,2.0)*pow(hp1.radius.y,2.0)*ray.dir.z); 

        float c = (pow(hp1.radius.y,2.0)*hp1.radius.z*pow(ray.pos.x,2.0))-
                    (pow(hp1.radius.x,2.0)*hp1.radius.z*pow(ray.pos.y,2.0))-
                    (pow(hp1.radius.x,2.0)*pow(hp1.radius.y,2.0)*ray.pos.z);
    
        float discriminant = pow(b, 2.0) - (4.0*a*c);
        if(discriminant >= 0.0){
            float t0 =( -b - sqrt(discriminant)) / (2.0 * a) ;
            float t1 =( -b + sqrt(discriminant)) / (2.0 * a) ;
            vec3 position =  (ray.pos + (ray.dir * t1)); 
            
            if(abs(position.x) < hp1.bounds.x && abs(position.y) < hp1.bounds.y && abs(position.z) < hp1.bounds.z ){
                if(t1 > 0.0 && t1 <= hit.t){
                    hit.t = t1; 
                    hit.position = position;
                    // hit.normal = normalize(2.0 * (hit.position - c1.center)); 
                    hit.mtl = hp1.mtl;
        
                    foundHit = true; 
                } 
            }        
        }
        return foundHit; 
    }
    
    vec4 RayTracerHyperbolicParaboloid( Ray ray){
        HitInfo hit; 
        if(IntersectRayHyperbolicParaboloid(hit, ray)){
            vec3 view = normalize( -ray.dir );
            vec3 clr = hit.position; // test
            return vec4(clr,1.0);
        }else{
            return vec4( textureCube( envMap, ray.dir.xzy ).rgb, 0 );	// return the environment color
        }
    }
    
`