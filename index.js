const yc = require('yandex-cloud');

const { bot } = require('./bot.js');

const getResponseHeaders = () => {
    return {
        'Access-Control-Allow-Origin': '*'
    };
}

module.exports.handler = async event => {
    try {

        const body = JSON.parse(event.body);
        await bot.handleUpdate(body);

        return {
            statusCode: 200,
            headers: getResponseHeaders(),
            body: JSON.stringify(
                {
                    message: 'Ok',
                })
        };

    } catch (err) {

        console.log("Error: ", err);
        return {
            statusCode: err.statusCode ? err.statusCode : 500,
            headers: getResponseHeaders(),
            body: JSON.stringify({
                error: err.name ? err.name : "Exception",
                message: err.message ? err.message : "Unknown error"
            })
        };
    }
};