type buttonProps={
    buttonLabel:string,
    buttonClass:string,
};
export default  function Button({ buttonLabel, buttonClass }:buttonProps){
    const buttonColor = (buttonClass === 'primary')?'red':'blue';
    return (
        <>
            <button className={`bg-${buttonColor}-700 text-white border rounded-lg font-overpass p-2 shadow-${buttonColor}-700 active:transform: translateY(2px);`}>{buttonLabel}</button>
        </>
    );
}