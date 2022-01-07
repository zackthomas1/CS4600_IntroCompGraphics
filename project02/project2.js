class Matrix3{
	constructor(a00=1, a01=0, a02=0, 
				a10=0, a11=1, a12=0, 
				a20=0, a21=0, a22=1){
		this.array = [	[a00, a01, a02],
						[a10, a11, a12],
						[a20, a21, a22]	];
	}

	matrixMultiplication(matrix3_02){
		let outputMatrix = new Matrix3(); 

		for(let row = 0; row < this.array.length; row++ ){
			for(let col = 0; col < this.array[0].length; col++ ){
				outputMatrix.array[row][col] = this.array[row][0] * matrix3_02.array[0][col] +  
												this.array[row][1] * matrix3_02.array[1][col] +
												this.array[row][2] * matrix3_02.array[2][col];
			}
		}
		return outputMatrix
	}

	stringify(){

		let outputString = "";

		for(let row = 0; row < this.array.length; row++ ){
			for(let col = 0; col < this.array[0].length; col++ ){
				outputString += this.array[row][col] + " ";
			}
			outputString += "\n ";
		}
		return outputString;
	}

	getOutputArray(){
		return Array(this.array[0][0], this.array[1][0], this.array[2][0], 
					this.array[0][1], this.array[1][1], this.array[2][1], 
					this.array[0][2], this.array[1][2], this.array[2][2] );
	}
}

// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The transformation first applies scale, then rotation, and finally translation.
// The given rotation value is in degrees.
function GetTransform( positionX, positionY, rotation, scale )
{
	let outputMatrix = new Matrix3(); 

	const theta = rotation * (Math.PI / 180);

	let rotateMatrix = new Matrix3(		Math.cos(theta), -Math.sin(theta), 0, 
										Math.sin(theta), Math.cos(theta), 0, 
										0, 0, 1);
	// console.log("Rotation Matrix: \n", rotateMatrix.stringify())

	let scaleMatrix = new Matrix3(	scale,0,0,
									0,scale,0,
									0,0,1);
	// console.log("Scale Matrix: \n", scaleMatrix.stringify())

	let translateMatrix = new Matrix3(1,0, positionX, 
										0,1, positionY,
										0,0,1);
	// console.log("Translation Matrix: \n", translateMatrix.stringify())

	// read right-to-left (apply scale, then rotation, and finally translation)
	// M = tranlateMatrix * rotateMatrix * scaleMatrix 
	outputMatrix = translateMatrix.matrixMultiplication(rotateMatrix.matrixMultiplication(scaleMatrix));
	// console.log("Output Matrix: \n" + outputMatrix.stringify());

	return outputMatrix.getOutputArray();
}

// Returns a 3x3 transformation matrix as an array of 9 values in column-major order.
// The arguments are transformation matrices in the same format.
// The returned transformation first applies trans1 and then trans2.
function ApplyTransform( trans1, trans2 )
{

	let trans1Matrix = new Matrix3(	trans1[0], trans1[3], trans1[6],
									trans1[1], trans1[4], trans1[7],
									trans1[2], trans1[5], trans1[8] ); 
	let trans2Matrix = new Matrix3(	trans2[0], trans2[3], trans2[6],
									trans2[1], trans2[4], trans2[7],
									trans2[2], trans2[5], trans2[8] );  

	let outputMatrix = trans2Matrix.matrixMultiplication(trans1Matrix);  

	return outputMatrix.getOutputArray(); 
}
