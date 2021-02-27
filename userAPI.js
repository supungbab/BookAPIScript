const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
//위에 두줄은 DynamoDB에 접근하기 위한 sdk 입니다.

//이벤트를 처리하기위한 핸들러입니다. 호출시 작동합니다.
exports.handler = async (event, context) => {
    //console.log('Received event:', JSON.stringify(event, null, 2));

    let body; //반환값을 담을 변수
    let statusCode = '200'; //상태코드이다.
    const headers = { //헤더 부분
        'Content-Type': 'application/json',
    };

    var params = { //users 테이블에 접근하기위한 객체
        TableName: "users",
    }
    
    try { //여러 읍답을 처리하기위해 switch를 사용.
    //분활해서 사용할 시 함수를 더 만들면된다.
        switch (event.httpMethod) {
            case 'DELETE': //DELETE 메소드 처리
                if(event.resource=="/users/{id}"){
                    params.Key={"id":event.pathParameters.id};
                    body = await dynamo.delete(params).promise();
                }
                break;
            case 'GET': //GET 메소드 처리
                if(event.resource=="/users/{id}"){
                    params.Key={"id":event.pathParameters.id};
                    body = await dynamo.get(params).promise();
                }
                if(event.resource=="/users")
                    body = await dynamo.scan(params).promise();
                break;
            case 'POST': //POST 메소드 처리
                if(event.resource=="/users"){
                    body = await dynamo.put(JSON.parse(event.body)).promise();
                }
                break;
            case 'PUT': //PUT 메소드 처리
                params.Key={"id":event.pathParameters.id};
                Object.assign(params,JSON.parse(event.body));
                body = await dynamo.update(params).promise();
                break;
            default: //마지막 오류 처리
                throw new Error(`Unsupported method "${event.httpMethod}"`);
        }
    } catch (err) {
        statusCode = '400';
        body = err.message;
    } finally {
        body = JSON.stringify(body);
    }

    return {
        statusCode,
        body,
        headers
    };
};
