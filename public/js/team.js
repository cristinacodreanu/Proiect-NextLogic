document.addEventListener('DOMContentLoaded', (e)=>{    
    var xhttp = new XMLHttpRequest();
    var team = document.getElementById('team');
    xhttp.onreadystatechange = function () {
        if (this.readyState == 4 && this.status == 200) {
        try{ 
            var items = JSON.parse(this.responseText) || [];
           
            items.forEach(element => {
                //creare div 
                let div = document.createElement('div');
                div.className = 'team--member';

                //creare imagine cu url
                let img = document.createElement('img');
                img.src = element.url;
                img.className = 'team--member--foto';
                img.alt = '';
   
                let name = document.createElement('p');
                name.className = 'team--member--name';
                name.innerHTML = element.name;

                let prof = document.createElement('p');
                prof.innerHTML=element.prof;
                prof.className='team--member--prof';

                div.appendChild(img);
                div.appendChild(name);
                div.appendChild(prof);
                team.appendChild(div);               
            });  
             
           }
           catch(e){ 
            console.error(e);
           }
          }
    }
    xhttp.open("GET","team.json", true);
    xhttp.send();
});
