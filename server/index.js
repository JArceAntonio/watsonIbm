var express = require('express');
var app = express();
var fs = require('fs');
var DiscoveryV1 = require('watson-developer-cloud/discovery/v1');
const bodyParser = require('body-parser');
app.use(bodyParser.urlencoded({extended : false}));
app.use(bodyParser.json());

const multer = require('multer');


const storage = multer.diskStorage({
    destination : function(req, file, cb){
     cb(null, './server/uploads/');//http://www.webticsa.com/memes/assets/
    },

    filename : function(req, file, cb){
        var ruta = file.originalname;
        cb(null, ruta);
        req.body.document = ruta; 
    }
});
const upload = multer({storage : storage});

var username = 'COLOCA AQUI TU USERNAME DE IBM WATSON DISCOVERY';
var password = 'COLOCA AQUI TU PASSWORD DE IBM WATSON DISCOVERY';
var environment_id = 'COLOCA AQUI EL ENVIROMENT_ID DE IBM WATSON DISCOVERY';
var collection_id = 'COLOCA AQUI EL COLLECTION_ID DE IBM WATSON DISCOVERY';

var discovery = new DiscoveryV1({
  username: username,
  password: password,
  version: 'v1',
  version_date: '2017-11-07'
});

app.use(express.static('client'));


app.post('/addDocument',upload.single('document'),function(req, res){
    console.log(req.body.document);
     var file = fs.readFileSync('./server/uploads/'+req.body.document);

    discovery.addDocument({ environment_id: environment_id, collection_id: collection_id, file: file },
        function(error, data) {
            if(error){
                console.log(JSON.stringify(error, null, 2));
                res.status(500).send({mensaje:'listo'});
            }
            else{
                console.log(JSON.stringify(data, null, 2));
                res.status(200).send({mensaje:'listo'});
            }
            
        }); 
});


// Ruta para mostrar exactamente lo que recumperamos de watson

app.get('/data/:consulta', function(req, res){
    var texto = 'diabetes';
    console.log(req.params.consulta);
    if(req.params.consulta != undefined){
        texto = req.params.consulta;
    }
	discovery.query({ 
			environment_id: environment_id,
			collection_id: collection_id,
			query: texto, 
			passages:true,
			passages_count: 99
		},
		function(error, data) {
						
			var data1 = {
				passages : data.passages,
				matching_results : data.matching_results,
				results : data.results,
				depurado : porComboBox(data.passages)
			};
			res.status(200).send(data1);	
		}
	);
});

// Ruta auxiliar

var listaEnfermedades = [];

app.post('/addEnfermedad', function(req, res){
    var enfermedad = req.body.enfermedad;
	if (!listaEnfermedades.includes(enfermedad)) {
		listaEnfermedades.push(enfermedad);
	}
    res.status(200).send({enfermedad : enfermedad});
});

// Ruta para el gráfico de barras

app.post('/estadistica', function(req, res){
	var consulta = 'personas con ' + listaEnfermedades[0];
	for (let i = 1; i < listaEnfermedades.length; i++) {
		consulta += ', personas con ' + listaEnfermedades[i];
	}
	discovery.query({ 
			environment_id: environment_id,
			collection_id: collection_id,
			query: consulta, 
			passages:true,
			passages_count: 99
		},
		function(error, data) {
			discovery.getCollection({ 
				environment_id: environment_id,
				collection_id: collection_id,
			},
			function(error, resCollections) {
				var data1 = {
					result : porEnfermedades(data.passages, listaEnfermedades),
					available : resCollections.document_counts.available
				};
				listaEnfermedades = [];
				res.status(200).send(data1); 
			});
		}
	);
});

// Ruta de la consulta con los dos select

var palabrasHombre = ["género: m", "sexo: m", "genero: m", "masculino", "varon", "varón", "hombre"];
var palabrasMujer = ["género: f", "sexo: f", "genero: f", "mujer", "femenino", "femenina"];

app.get('/consultaentrenada/:consulta', function(req, res){
    var texto = 'mujeres con diabetes';
    console.log(req.params.consulta);
    if(req.params.consulta != undefined){
        texto = req.params.consulta;
    }
	var consultaGenero = "genero femenino, sexo femenino, genero femenina, sexo femenina, " + 
				"genero f, sexo f, genero mujer, sexo mujer";
	var arregloGenero = palabrasMujer;
	if (texto.includes("hombres")) {
		consultaGenero = "genero masculino, sexo masculino, genero m, sexo m, genero hombre, sexo hombre, " + 
				"genero varón, sexo varón, genero varon, sexo varon";
		arregloGenero = palabrasHombre;
	}
	discovery.query({ 
			environment_id: environment_id,
			collection_id: collection_id,
			query: texto, 
			passages:true,
			passages_count: 99
		},
		function(error, data) {
			discovery.getCollection({ 
				environment_id: environment_id,
				collection_id: collection_id,
			},
			function(error, resCollections) {
				var data1 = {
					enfermos : porComboBox(data.passages).length,
					total : Math.round((resCollections.document_counts.available) / 2)
				};
				listaEnfermedades = [];
				res.status(200).send(data1); 
			});
		}
	);
});

// ************************** Mis Algoritmos ***************************

// ************************* Principales *****************************

function porComboBox(arregloDePasajes) {
	separado_por_documentos = separarPorDocumentos(arregloDePasajes);
	return depurarFamiliares(separado_por_documentos);
}

function porEnfermedades(arregloDePasajes, enfermedades) {
	separado_por_documentos = separarPorDocumentos(arregloDePasajes);
	depurado = depurarFamiliares(separado_por_documentos);
	pasajesPorDoc = buscarPasajesPorEnfermedad(depurado, enfermedades);
	for (let i = 0; i < enfermedades.length; i++) {
		pasajesPorDoc[i].cantidad = pasajesPorDoc[i].pasajes.length;
	}
	return pasajesPorDoc;
}

function obtenerTotalPorGenero(arregloDePasajes, arregloGenero) {
	return separarPorDocumentos(arregloDePasajes);
	//separado_por_documentos = separarPorDocumentos(arregloDePasajes);
	//depurado = depurarFamiliares(separado_por_documentos);
	//return depurarConPalabrasClaveDeGenero(separado_por_documentos, arregloGenero);
}

// ************************ Auxiliares ****************************

var palabrasClaveFamiliares = ['familia', 'padre', 'papa', 'papá',
	'madre', 'mamá', 'hermana', 'hermano', 'abuelo', 'abuela'
]

function separarPorDocumentos(pasajes) {
	/*var*/ result = [];
	for (let i = 0; i < pasajes.length; i++) {
		pasaje = pasajes[i];
		index = existeDocumento(result, pasaje.document_id);
		if (index == -1) {
			result.push([pasaje]);
		} else {
			result[index].push(pasaje);
		}
	}
	return result;
}

function existeDocumento(arreglo, doc_id) {
	for (let i = 0; i < arreglo.length; i++) {
		pasjesDeDocumento = arreglo[i];
		if (pasjesDeDocumento[0].document_id == doc_id) {
			return i;
		}
	}
	return -1;
}

function depurarFamiliares(arregloDeArreglos) {
	var result = [];
	for (let i = 0; i < arregloDeArreglos.length; i++) {
		nuevoArregloDeDocumento = [];
		arregloDeUnSoloDocumento = arregloDeArreglos[i];
		for (let j = 0; j < arregloDeUnSoloDocumento.length; j++) {
			elemento = arregloDeUnSoloDocumento[j];
			if (!seEncontroPalabraClaveFamilia(elemento.passage_text)) {
				nuevoArregloDeDocumento.push(elemento);
			}
		}
		if (nuevoArregloDeDocumento.length > 0) {
			result.push(nuevoArregloDeDocumento);	
		}
	}
	return result;
}

function seEncontroPalabraClaveFamilia(passage_text) {
	passage_text_minusculas = passage_text.toLowerCase();
	for (let k = 0; k < palabrasClaveFamiliares.length; k++) {
		if (passage_text_minusculas.includes(palabrasClaveFamiliares[k])) {
			return true;
		}
	}
	return false;
}

function buscarPasajesPorEnfermedad(depurado, enfermedades) {
	var result = [];
	for (let i = 0; i < enfermedades.length; i++) {
		var resultadoDeEnfermedadI = buscarPasajesDeUnaEnfermedad(depurado, enfermedades[i]);
		result.push({
			enfermedad : enfermedades[i],
			//pasajes : buscarPasajesDeUnaEnfermedad(depurado, enfermedades[i])
			pasajes : resultadoDeEnfermedadI
		});
	}
	return result;
}

function buscarPasajesDeUnaEnfermedad(depurado, enfermedad) {
	result = [];
	for (let i = 0; i < depurado.length; i++) {
		arregloDeDocumento = depurado[i];
		arregloPorEnfermedadYDocumento = [];
		for (let j = 0; j < arregloDeDocumento.length; j++) {
			elemento = arregloDeDocumento[j];
			pasaje = elemento.passage_text;
			pasaje_miuscula = pasaje.toLowerCase();
			if ((enfermedad == 'diabetes' && pasaje_miuscula.includes(enfermedad)) || 
				(enfermedad == 'cáncer' && (pasaje_miuscula.includes('cancer') || pasaje_miuscula.includes('cáncer'))) ||
				(enfermedad == 'hipertensión' && (pasaje_miuscula.includes('hipertensión') || pasaje_miuscula.includes('hipertension')))) {
				arregloPorEnfermedadYDocumento.push(elemento);
			}
		}
		if (arregloPorEnfermedadYDocumento.length > 0) {
			result.push(arregloPorEnfermedadYDocumento)
		}
	}
	return result;
}
	
function depurarConPalabrasClaveDeGenero(depurado, arregloGenero) {
	var result = [];
	for (let i = 0; i < depurado.length; i++) {
		nuevoArregloDeDocumento = [];
		arregloDeUnSoloDocumento = depurado[i];
		for (let j = 0; j < arregloDeUnSoloDocumento.length; j++) {
			elemento = arregloDeUnSoloDocumento[j];
			if (!seEncontroPalabraClaveGenero(elemento.passage_text, arregloGenero)) {
				nuevoArregloDeDocumento.push(elemento);
			}
		}
		if (nuevoArregloDeDocumento.length > 0) {
			result.push(nuevoArregloDeDocumento);	
		}
	}
	return result;
}

function seEncontroPalabraClaveGenero(passage_text, arregloGenero) {
	passage_text_minusculas = passage_text.toLowerCase();
	for (let k = 0; k < arregloGenero.length; k++) {
		if (passage_text_minusculas.includes(arregloGenero[k])) {
			return true;
		}
	}
	return false;
}
	
// ************************** Mis Algoritmos ***************************

app.listen(process.env.PORT || 3000, function(){
    console.log('servidor en puerto 3000');
});