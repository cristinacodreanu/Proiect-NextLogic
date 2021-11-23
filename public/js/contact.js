var validNume = false;
var validPrenume = false;
var validTel = false;
var validEmail = false;


document.addEventListener('DOMContentLoaded', (e)=>{ 
    var contactButton = document.getElementById('contact-button');
    contactButton.addEventListener('click', (e)=>{ 
        if((!validNume || !validEmail || !validPrenume || !validTel)){ 
            console.log('in button event');
            document.getElementById('error-span').innerHTML = "Vă rugăm să completați corect cîmpurile!"
            e.preventDefault();
            e.stopPropagation();
        }
        else{ 
            document.getElementById('error-span').innerHTML  = "";
        }
    })

});
function onfocusoutInput(input)
{ 
    let error = document.getElementsByClassName("error " + input.id);
    if(input.value === ""){         
        if(error[0].id === "invisible")
        {    
            error[0].id = "visible"; // apare mesajul de eroare cu rosu
            input.style.borderColor = "#FF0000" ;         
        }
    }

    else{ 

        if(error[0].id === "visible")
        {    
            error[0].id = "invisible";                   
        }

        var isCorrect = false;
        switch(input.id){ 
            case 'nume':
                isCorrect = checkName(input.value); 
                validNume = isCorrect;
                console.log('nume: '+validNume);             
                break;
            
            case 'prenume':
                isCorrect = checkName(input.value);
                validPrenume = isCorrect;
                console.log('prenume: '+validPrenume);  
                break;
            
            case 'email':
                isCorrect = checkEmail(input.value);
                validEmail = isCorrect;
                console.log('email: '+validEmail);  
                break;

            case 'telefon':
                isCorrect = checkTelephone(input.value);
                validTel = isCorrect;
                console.log('telefon: '+validTel);  
                break;
        }
        
        if(isCorrect){ 
            input.style.borderColor = "green" ; 
        }
        if(!isCorrect)
         {
            input.style.borderColor = "red" ;  
         }
    }

}

function checkEmail(email){ 
   const re = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/; 
   return re.test(String(email));
}

function checkName(name){ 
    const re = /^[a-zA-Z][a-zA-Z\s]*$/;
    return re.test(String(name));   
}

function checkTelephone(tel){ 
    const re = /^[0-9]*$/;
    return re.test(String(tel));
}



