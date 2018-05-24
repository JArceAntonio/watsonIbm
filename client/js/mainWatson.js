$(document).ready(function(){
    $('#enfermedad').material_select();
    $('#enfermedad2').material_select();
    $('#enfermedades2').material_select();
    $('#genero').material_select();

    $('#form').on('submit', function(event){
        event.preventDefault();
        var datos = new FormData($('#form')[0]);
       
    $.ajax({
    url : '/addDocument',
    type: 'POST',
    data : datos,
    processData: false,
    contentType: false,
    mimeType: "multipart/form-data",
    beforeSend: function(){
        $('#json').html('');
        $('#enfermedades').html('');
        $('#estadistica').html('');
        preoloader();
    }  
  })
    .done(function(res){
       preoloaderFin();
       swal("Good job!", "You clicked the button!", "success");
    })
    .fail(function(res){
        preoloaderFin();
        swal("Fail!", "You clicked the button!", "error");
    })
    .always(function(){
        console.log('complete')
    });
    });
    $('#consultar').click(function(){
        var text = $('#texto').val();
        if(text === ''){
            alert('Rellene el Campo Consulta');
            return;
        }
        
        var route = '/data/'+text;
        $.ajax({
            url:route,
            type : 'GET',
            beforeSend: function(){
                $('#json').html('');
                $('#enfermedades').html('');
                $('#estadistica').html('');
                preoloader();
            },
            success : function(res){
                preoloaderFin();
                var lista = res.passages;
                for (let index = 0; index < lista.length; index++) {
                    const element = lista[index];
                    const paragraph = document.createElement('p');
                    const textElement = document.createTextNode(deleteHtmlTags(element.passage_text));
                    paragraph.appendChild(textElement);
                    document.getElementById('json')
                        .appendChild(paragraph)
                        .appendChild(document.createElement('hr'));
                }
            }
        })

    });
});


var data = [];

$('#addEnfermedad').click(function(){
    console.log(document.getElementsByClassName('row')[1].clientHeight);
    var enfermedad = $('#enfermedad').val();
    $('#json').html('');

    for (let index = 0; index < data.length; index++) {
        const element = data[index];
        if(element === enfermedad){
            return 0;
        }
    }
    
    $('#estadistica').html('');
    data.push(enfermedad);
    $('#enfermedades').append(`
    <li class="collection-item">${enfermedad}</li>`);
    $.ajax({
        url: '/addEnfermedad',
        type : 'POST',
        data : {enfermedad : enfermedad},
        success : function(res){
            console.log(res);
        }
    })
});

$('#consultarLista').click(function(){
    if(data.length === 0){
        swal("Fail!", "No Existen Datos en la Lista", "error");
        return;
    }
    
    var route = '/estadistica';
    $.ajax({
        url : route,
        type : 'POST',
        data : data,
        beforeSend : function(){
            $('#json').html('');
            $('#enfermedades').html('');
            $('#estadistica').html('');
            preoloader();
        },
        success : function(res){
            preoloaderFin();
            console.log(res);
            $('#enfermedades').html('');
            data = [];
            res = res.result;
            var ParserDatos = [];
            for (let index = 0; index < res.length; index++) {
                const element = res[index];
                ParserDatos.push({
                    x : element.enfermedad, y : ((element.cantidad/43)*100).toFixed(2)
                });
            }
            console.log(ParserDatos);
            /*
                  {x: 'Cancer', y: 3/*, z: 2, a: 3},
                  {x: 'Diabetes', y: 2/*, z: null, a: 1},
                  {x: 'Hipertencion', y: 2/*, z: 4, a: 3}
            */ 
            Morris.Bar({
                element: 'estadistica',
                data: ParserDatos,
                xkey: 'x',
                ykeys: ['y'],
                labels: ['Porcentaje'],
                hoverCallback: function (index, options, content, row) {
                    return 'Porcentaje: ' + row.y + '%';
                }
              }).on('click', function(i, row){
                console.log(i, row);
              });
        },
        error : function(){
            preoloaderFin();
        }
    });
});

$('#consultar2').click(function(){
    var genero = $('#genero').val();
    var enfermedad = $('#enfermedad2').val();
    var ruta = '/consultaentrenada/' + genero + ' con ' + enfermedad;
    $.ajax({
        url: ruta,
        type : 'GET',
        beforeSend : function(){
            $('#json').html('');
            $('#enfermedades').html('');
            $('#estadistica').html('');
            preoloader();
        },
        error : function(){
            preoloaderFin();
            alert('error');
        },
        success: function (response) {
            $('#enfermedades').html('');
            $('#estadistica').html('');
            $('#json').html('');

            Morris.Donut({
                element: 'estadistica',
                data:[
                    {label: 'Porcentaje de enfermos', value: ((response.enfermos/response.total) * 100).toFixed(2)},
                    {label: 'Porcentaje de sanos', value: (((response.total - response.enfermos)/response.total) * 100).toFixed(2)}
                ],
                colors: [
                    '#2fa44f',
                    '#5cb5b4'
                ],
                formatter: function (x) { return x + "%"},
            });

            preoloaderFin();
        }
    })
});
function cargarLinea(){
    new Morris.Line({
        // ID of the element in which to draw the chart.
        element: 'campo',
        // Chart data records -- each entry in this array corresponds to a point on
        // the chart.
        data: [
          { year: '2008', value: 20 },
          { year: '2009', value: 10 },
          { year: '2010', value: 5 },
          { year: '2011', value: 5 },
          { year: '2012', value: 20 }
        ],
        // The name of the data record attribute that contains x-values.
        xkey: 'year',
        // A list of names of data record attributes that contain y-values.
        ykeys: ['value'],
        // Labels for the ykeys -- will be displayed when you hover over the
        // chart.
        labels: ['Value']
      });
}

function preoloader(){
    var cadena = `<div class="preloader-wrapper big active">
    <div class="spinner-layer spinner-blue-only">
      <div class="circle-clipper left">
        <div class="circle"></div>
      </div><div class="gap-patch">
        <div class="circle"></div>
      </div><div class="circle-clipper right">
        <div class="circle"></div>
      </div>
    </div>
  </div>`;
    $('#json2').html(cadena);
}

function preoloaderFin(){
    $('#json2').html('');
}

function deleteHtmlTags(paragraph) {
    let start = paragraph.indexOf("<");
    let end = paragraph.indexOf(">");
    while (start !== -1 || end !== -1){
        // console.log(start + " - " + end);
        var numberOfCharacters;
        if ((start === -1 && end !== -1) || (start > end && end !== -1)){
            start = 0;
            numberOfCharacters = end + 1;
        }else if(start !== -1 && end === -1){
            numberOfCharacters = paragraph.length - start;
            // console.log('LENGTH:' - paragraph.length);
        }else{
            numberOfCharacters = end - start + 1;
        }
        let subString = paragraph.substr(start, numberOfCharacters);
        paragraph = paragraph.replace(subString, "");
        // console.log(paragraph);
        start = paragraph.indexOf("<");
        end = paragraph.indexOf(">");
    }
    return paragraph;
}
