type buttonProps={
    buttonLabel:string,
    buttonClass:string,
};
export default  function Button({ buttonLabel, buttonClass }:buttonProps){
    const bgColor:string = (buttonClass === 'primary')?'bg-red-700':'bg-blue-700';
    const shadowColor:string = (buttonClass === 'primary')?'shadow-red-700':'shadow-blue-700';
    return (
        <>
            <button className={`${bgColor} text-white border rounded-lg font-overpass p-2 ${shadowColor} active:transform: translateY(2px);`}>{buttonLabel}</button>
        </>
    );
}