//TAREAS OBLIGATORIAS

//1. Esquemas de validación para ambas colecciones.
/*
restaurants
*/
db.runCommand({
    collMod: "restaurants",
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["_id", "name", "type_of_food", "rating"],
            properties: {
                _id: { bsonType: "objectId" },
                name: { bsonType: "string", description: "Nom del restaurant" },
                type_of_food: { bsonType: "string", description: "Tipus de menjar" },
                rating: {
                    bsonType: "double",
                    minimum: 0,
                    maximum: 10,
                    description: "Qualificació del restaurant"
                }
            }
        }
    },
    validationLevel: "strict",

});

/*
inspections
*/
db.runCommand({
    collMod: "inspections",
    validator: {
        $jsonSchema: {
            bsonType: "object",
            required: ["_id", "restaurant_id", "inspection_date", "result"],
            properties: {
                _id: { bsonType: "objectId" },
                restaurant_id: { bsonType: "objectId", description: "Referència al restaurant" },
                inspection_date: { bsonType: "date", description: "Data de la inspecció" },
                result: {
                    bsonType: "string",
                    enum: ["pass", "fail"],
                    description: "Resultat de la inspecció"
                }
            }
        }
    },
    validationLevel: "moderate",
    validationAction: "error"
});




//2.Implementación de consultas en MongoDB

/*
Buscar todos los restaurantes de un tipo de comida específico (ej. "Chinese").
*/
db.restaurants.find(
    { "type_of_food": "Curry" },
    { "_id": 0, "name": 1, "type_of_food": 1 }
)

/*
Listar las inspecciones con violaciones, ordenadas por fecha.
*/
db.inspections.find(
    { result: "Violation Issued" },
    { _id: 1, restaurant_id: 1, date: 1, result: 1 })
    .sort({ date: 1 })

/*
Encontrar restaurantes con una calificación superior a 4.
*/
db.restaurants.find(
    { "rating": { $gt: 4 } },
    { "_id": 0, "name": 1, "rating": 1 }
)


//Uso de Agregaciones

/*
Agrupar restaurantes por tipo de comida y calcular la calificación promedio.
*/
db.restaurants.aggregate([
    {
        $group: {
            _id: "$type_of_food", avg_rating: { $avg: "$rating" }
        }
    }])

/*
Contar el número de inspecciones por resultado y mostrar los porcentajes.
*/
db.inspections.aggregate([
    {
        $group: {
            _id: "$result",
            count: { $sum: 1 }
        }
    },
    {
        $group: {
            _id: null,
            totalInspections: { $sum: "$count" },
            results: { $push: { result: "$_id", count: "$count" } }
        }
    },
    {
        $unwind: "$results"
    },
    {
        $project: {
            _id: 0,
            result: "$results.result",
            count: "$results.count",
            percentage: {
                $multiply: [{ $divide: ["$results.count", "$totalInspections"] }, 100]
            }
        }
    }
])


/*
Unir restaurantes con sus inspecciones utilizando $lookup.
*/
db.restaurants.aggregate([{
    "$lookup": {
        "from": "inspections",
        "let": {
            "restaurantId": "$_id"
        },
        "pipeline": [
            {
                "$match": {
                    "$expr": {
                        "$eq": [
                            {
                                "$toString": "$restaurant_id"
                            },
                            {
                                "$toString": "$$restaurantId"
                            }
                        ]
                    }
                }
            }
        ],
        "as": "restaurantInspections"
    }
}
]
)

//TAREAS AVANZADAS

//1. Optimización del rendimiento

/*
Implementar índices adecuados para las consultas
*/
db.inspections.createIndex({ "restaurant_id": 1, "result": 1 })

db.restaurants.createIndex({ "address line 2": 1, "type_of_food": 1 })

/*
Comparar el rendimiento antes y después de crear los índices utilizando explain()
*/
db.inspections.find({
    "restaurant_id": "55f14312c7447c3da7051b26",
    "result": "Pass"
}).explain("executionStats")


db.restaurants.find(
    {
        "type_of_food": "Chinese",
        "address line 2": "London",
        "rating": { $gt: 4 }
    }
).explain("executionStats")







