const AWS = require('aws-sdk');
const dynamo = new AWS.DynamoDB.DocumentClient();
//위에 두줄은 DynamoDB에 접근하기 위한 sdk 입니다.

//이벤트를 처리하기위한 핸들러입니다. 호출시 작동합니다.
exports.handler = async (event, context) => {

    let body; //반환값을 담을 변수
    let statusCode = '200'; //상태코드이다.
    const headers = { //헤더 부분
        'Content-Type': 'application/json',
    };

    var params = { //books 테이블에 접근하기위한 객체
        TableName: "books",
    }
    
    try { //여러 읍답을 처리하기위해 switch를 사용.
    //분활해서 사용할 시 함수를 더 만들면된다.
        switch (event.httpMethod) { //event객체에 메소드를 확인하여 넘겨줌
            case 'DELETE': //DELETE 메소드 처리
                if(event.resource=="/books/{code}"){ //RESTful 처리를 위한 조건
                    params.Key={"code":event.pathParameters.code};
                    //params객체에 Key값을 추가.
                    //pathParameters 도서코드가 들어있음.
                    body = await dynamo.delete(params).promise();
                    //awit를 써주지 않을 시 오류
                    //dynamo객체에 delete 메소드 실행
                }
                break;
            case 'GET': //GET 메소드 처리
                if(event.resource=="/books/{code}"){ //RESTful 처리를 위한 조건
                    params.Key={"code":event.pathParameters.code};
                    body = await dynamo.get(params).promise();
                    //마찬가지로 get 메소드 실행
                }
                if(event.resource=="/books")// 전체 book 출력시 사용
                    body = await dynamo.scan(params).promise();
                break;
            case 'POST': //POST 메소드 처리
                if(event.resource=="/books"){ // book 추가시 사용
                    body = await dynamo.put(JSON.parse(event.body)).promise();
                }
                break;
            case 'PUT': //PUT 메소드 처리
                //책 수정시 사용
                params.Key={"code":event.pathParameters.code};
                Object.assign(params,JSON.parse(event.body));
                //params 객체와 event.body 객체를 
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
