const InputField = ({ name, type, placeholder, className, register, validate, errors, ...rest }) => {
    return (
        <>
            <input
                type={type}
                name={name}
                placeholder={placeholder}
                className={`px-4 py-2 border border-border rounded-3xl bg-primary w-full outline-none ${className}`}
                {...register(name, !!validate && { validate })}
                {...rest}
            />

            {errors[name] && <p className="text-red text-left text-2xs">{errors[name]?.message}</p>}
        </>
    );
};

export default InputField;
