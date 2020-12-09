var arrInput1 = new Array(0);
  var arrInputValue1 = new Array(0);
 
function addInput1() {
  arrInput1.push(arrInput1.length);
  arrInputValue1.push("");
  display1();
}
 
function display1() {
  document.getElementById('parah1').innerHTML="";
  for (intI=0;intI<arrInput1.length;intI++) {
    document.getElementById('parah1').innerHTML+=createInput(arrInput1[intI], arrInputValue1[intI]);
  }
}
 
function saveValue1(intId1,strValue1) {
  arrInputValue1[intId1]=strValue1;
}  
 
function createInput1(id1,value1) {
  return "<input class='form-control' style='width:100%; float:left; margin-right:1%' name='tag' type='text' id='tag'"+ id1 +"' onChange='javascript:saveValue("+ id1 +",this.value)' value='"+ 
value1 +"'>   <br><br>";
}
 

// <input class='form-control' style='width:28%;' value='업로드' type='button'>

function deleteInput() {
  if (arrInput1.length > 0) { 
     arrInput1.pop(); 
     arrInputValue1.pop();
  }
  display1(); 
}