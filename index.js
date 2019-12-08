//See: https://medium.com/the-node-js-collection/modern-javascript-explained-for-dinosaurs-f695e9747b70
//See: https://webpack.js.org/configuration/output/
//See: https://medium.com/@svinkle/getting-started-with-webpack-and-es6-modules-c465d053d988

//var d3 = require("d3");

const test = function (a) {
    console.log(a);
    console.log("ahahah!");
}

const sum = (a, b) => {
    return a + b;
};

const product = (a, b) => {
    return a * b;
};

export {sum, product, test};
