/*

This code was derived by Kenneth Lichtenberger from StackBlur 
The algo is the same - contains speed tweaks and is adapted to work with a 8bit Gray array


Creidt for the algo goes to:
------------------------------------------------------
StackBlur - a fast almost Gaussian Blur For Canvas

Author:		Mario Klingemann
Contact: 	mario@quasimondo.com
Website:	http://www.quasimondo.com/StackBlurForCanvas
Twitter:	@quasimondo

In case you find this class useful - especially in commercial pgojects -
I am not totally unhappy for a small donation to my PayPal account
mario@quasimondo.de

Or support me on flattr: 
https://flattr.com/thing/72791/StackBlur-a-fast-almost-Gaussian-Blur-Effect-for-CanvasJavascript
/-----------------------------------------------------

StackBlur Copyright verbatim form org code:
------------------------------------------------------
Copyright (c) 2010 Mario Klingemann

Permission is hereby granted, free of charge, to any person
obtaining a copy of this software and associated documentation
files (the "Software"), to deal in the Software without
restriction, including without limitation the rights to use,
copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the
Software is furnished to do so, subject to the following
conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS pgOVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXpgESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
OTHER DEALINGS IN THE SOFTWARE.
/-----------------------------------------------------
*/

;stackBlurGray=(function (){
//===============================

var mul_table = [
        512,512,456,512,328,456,335,512,405,328,271,456,388,335,292,512,
        454,405,364,328,298,271,496,456,420,388,360,335,312,292,273,512,
        482,454,428,405,383,364,345,328,312,298,284,271,259,496,475,456,
        437,420,404,388,374,360,347,335,323,312,302,292,282,273,265,512,
        497,482,468,454,441,428,417,405,394,383,373,364,354,345,337,328,
        320,312,305,298,291,284,278,271,265,259,507,496,485,475,465,456,
        446,437,428,420,412,404,396,388,381,374,367,360,354,347,341,335,
        329,323,318,312,307,302,297,292,287,282,278,273,269,265,261,512,
        505,497,489,482,475,468,461,454,447,441,435,428,422,417,411,405,
        399,394,389,383,378,373,368,364,359,354,350,345,341,337,332,328,
        324,320,316,312,309,305,301,298,294,291,287,284,281,278,274,271,
        268,265,262,259,257,507,501,496,491,485,480,475,470,465,460,456,
        451,446,442,437,433,428,424,420,416,412,408,404,400,396,392,388,
        385,381,377,374,370,367,363,360,357,354,350,347,344,341,338,335,
        332,329,326,323,320,318,315,312,310,307,304,302,299,297,294,292,
        289,287,285,282,280,278,275,273,271,269,267,265,263,261,259];
        
   
var shg_table = [
	     9, 11, 12, 13, 13, 14, 14, 15, 15, 15, 15, 16, 16, 16, 16, 17, 
		17, 17, 17, 17, 17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 19, 
		19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 19, 20, 20, 20,
		20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 20, 21,
		21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 21,
		21, 21, 21, 21, 21, 21, 21, 21, 21, 21, 22, 22, 22, 22, 22, 22, 
		22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22,
		22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 22, 23, 
		23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
		23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23,
		23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 23, 
		23, 23, 23, 23, 23, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 
		24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
		24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
		24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24,
		24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24, 24 ];





function stackBlurGray(buff,width, height, radius )
{
	if ( isNaN(radius) || radius < 1 ) return;
	radius |= 0;
	
	var pixels = new Uint8Array(buff)		
	var x, y, i, p, yp, yi, yw, sum,
	out_sum,
	in_sum,
	pg, bs;
			
	var div = radius + radius + 1;
	var widthMinus1  = width - 1;
	var heightMinus1 = height - 1;
	var radiusPlus1  = radius + 1;
	var sumFactor = radiusPlus1 * ( radiusPlus1 + 1 ) * 0.5;
	
	var stackStart = new BlurStack();
	var stack = stackStart;
	var stackEnd
	i = 1
	do{
		stack = stack.next = new BlurStack();
		if ( i++ == radiusPlus1 ) stackEnd = stack;
	}while(i < div)
	stack.next = stackStart;
	var stackIn = null;
	var stackOut = null;
	
	yw = yi = 0;
	
	var mul_sum = mul_table[radius];
	var shg_sum = shg_table[radius];
	y=0
	do{
		in_sum = sum = 0;
		
		out_sum = radiusPlus1 * ( pg = pixels[yi] );
		
		
		sum += sumFactor * pg;
		
		
		stack = stackStart;
		i = 0
		do{
			stack.v = pg;
			stack = stack.next;
			i++
		}while(i < radiusPlus1)
		i = 1
		do{
			p = yi + ( widthMinus1 < i ? widthMinus1 : i );
			sum += ( stack.v = ( pg = pixels[p])) * ( bs = radiusPlus1 - i );
			
			in_sum += pg;
					
			stack = stack.next;
			i++
		}while(i < radiusPlus1)
		
		
		stackIn = stackStart;
		stackOut = stackEnd;
		x=0
		
		do{
			pixels[yi]   = (sum * mul_sum) >> shg_sum;
			
			
			sum -= out_sum;
			
			
			out_sum -= stackIn.v;
			
			
			p =  ( yw + ( ( p = x + radius + 1 ) < widthMinus1 ? p : widthMinus1 ) );
			
			in_sum += ( stackIn.v = pixels[p]);
			
			
			sum += in_sum;
			
			
			stackIn = stackIn.next;
			
			out_sum += ( pg = stackOut.v );
			
			
			in_sum -= pg;
			
			
			stackOut = stackOut.next;

			yi++;
			x++
		}while(x < width)
		yw += width;
		y++
	}while(y < height)

	x=0
	
	do{
		in_sum = sum = 0;
		
		yi = x;
		out_sum = radiusPlus1 * ( pg = pixels[yi]);
		
		
		sum += sumFactor * pg;
		
		
		stack = stackStart;
		
		for( i = 0; i < radiusPlus1; i++ )
		{
			stack.v = pg;
			stack = stack.next;
		}
		
		yp = width;
		
		i=1
		
		do{
			yi = ( yp + x );
			
			sum += ( stack.v = ( pg = pixels[yi])) * ( bs = radiusPlus1 - i );
			
			
			in_sum += pg;
			
			
			stack = stack.next;
		
			if( i < heightMinus1 )
			{
				yp += width;
			}
		    i++
		}while(i <= radius)
		
		yi = x;
		stackIn = stackStart;
		stackOut = stackEnd;
		y=0
		do{
			p = yi;
			pixels[p]   = (sum * mul_sum) >> shg_sum;
			
			
			sum -= out_sum;
			
			
			out_sum -= stackIn.v;
			
			
			p = ( x + (( ( p = y + radiusPlus1) < heightMinus1 ? p : heightMinus1 ) * width ));
			
			sum += ( in_sum += ( stackIn.v = pixels[p]));
			
			
			stackIn = stackIn.next;
			
			out_sum += ( pg = stackOut.v );
			
			
			in_sum -= pg;
			
			
			stackOut = stackOut.next;
			
			yi += width;
			y++
		}while(y < height)
		x++
	}while(x < width)
	return pixels

	
}

function BlurStack()
{
    this.v = 0
	this.next = null;
}
return stackBlurGray
//===============================

})();

//code below this line did not come from BlurStack