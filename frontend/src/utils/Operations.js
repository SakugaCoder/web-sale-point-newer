const getTotal = (items) => {
    let total = 0;
    // console.log('getting total');
    items.forEach( (item,index) => {
        total += item.price * item.kg;
    });

    total = roundNumber(total);

    // console.log(total);

    return total;
};

function roundNumber(n){
    return Math.round((n + Number.EPSILON) * 100) / 100
}

export { getTotal, roundNumber };