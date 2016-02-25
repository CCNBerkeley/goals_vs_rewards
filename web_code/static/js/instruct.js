function exPlay1(){
	exClock();
	function exClock(){
		clock=Math.round(clock*100+1)/100;
		if(clock==0.5){document.getElementById('exbact').src="/static/images/lit.jpg";}
		if(clock==1){
			document.getElementById('exbact').src="/static/images/normal.jpg";
			clock=0;
			return false;
		}
		t=setTimeout("exPlay1()",10);
	}
}

function exPlay2(){
	exClock();
	function exClock(){
		clock=Math.round(clock*100+1)/100;
		if(clock==0.5){document.getElementById('exInd').src="/static/images/indOn.jpg";}
		if(clock==1){
			document.getElementById('exInd').src="/static/images/indOff.jpg";
			clock=0;
			return false;
		}
		t=setTimeout("exPlay2()",10);
	}
}

function toyForm() {
	var ans = new Array();
    ans[0] = document.getElementById('responseA').value;
    ans[1] = parseInt(ans[0]);
	ans[2] = document.getElementById('responseB').value;
    ans[3] = parseInt(ans[2]);
	ans[4] = document.getElementById('responseC').value;
    ans[5] = parseInt(ans[4]);
	for(var j=0;j<=2;j++){
		if(ans[2*j]!=ans[2*j+1]){
			alert("Please fill in each field, using only numeric characters in your responses.");
			return false;
			}
		if(ans[2*j+1]>100 || ans[2*j+1]<-100){
			alert("Please provide individual ratings between 0 (no confidence) and 100 (total confidence)");
			return false;
			}
		}
	var sum = ans[1]+ans[3]+ans[5];
	if(sum!=100){alert("The sum of your responses is equal to "+sum+". Please revise your entries so they add up to 100"); return false;}
	alert("Looks like you understand how the form works!")
}