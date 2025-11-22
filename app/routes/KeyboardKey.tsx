type KeyboardKeyProps = {
    str: string;
}

export default function KeyboardKey({ str }: KeyboardKeyProps) {
    return (
        <>
            <span className={`inline-block px-2 py-1 text-sm font-semibold font-mono text-gray-800 bg-gray-100 border border-gray-200 border-b-2 border-b-gray-300 rounded-md shadow-sm mx-0.5`} dangerouslySetInnerHTML={{ __html: str }}></span>
        </>
    );
}