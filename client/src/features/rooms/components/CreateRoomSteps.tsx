import { useFieldArray, useWatch, type UseFormReturn } from 'react-hook-form';
import { ROOM_LIMITS } from '../constants';
import { suggestSlug } from '../utils/persona';
import type { CreateRoomForm } from '../types';

type StepProps = { form: UseFormReturn<CreateRoomForm> };

const QUICK_RULES = ['No links.', '18+ only.', 'Stay on topic.', 'No spam.', 'English only.'];
const error = 'mt-1 text-xs text-red';

/** Step 2: title, link name and a line about the room. Compact enough to fit without scrolling. */
export const DetailsStep = ({ form }: StepProps) => {
  const { register, setValue, getValues, control, formState: { errors } } = form;
  const titleLen = useWatch({ control, name: 'title' }).length;
  const descLen = useWatch({ control, name: 'description' }).length;
  return (
    <div className="cr-fields">
      <div className="cr-field">
        <label htmlFor="room-title">Title</label>
        <div className="cr-box">
          <input id="room-title" {...register('title')} maxLength={ROOM_LIMITS.TITLE_MAX} placeholder="Midnight Coding" className="cr-box__input cr-box__input--lg" autoFocus />
          <span className="cr-box__count">{titleLen}/{ROOM_LIMITS.TITLE_MAX}</span>
        </div>
        {errors.title && <p role="alert" className={error}>{errors.title.message}</p>}
      </div>

      <div className="cr-field">
        <label htmlFor="room-slug">Link</label>
        <div className="cr-box">
          <span aria-hidden className="cr-box__prefix">/rooms/</span>
          <input id="room-slug" {...register('slug')} maxLength={ROOM_LIMITS.SLUG_MAX} placeholder="midnight-coding" className="cr-box__input" />
          <button
            type="button"
            onClick={() => setValue('slug', suggestSlug(getValues('title')), { shouldValidate: true })}
            className="cr-box__act"
          >
            Suggest
          </button>
        </div>
        {errors.slug && <p role="alert" className={error}>{errors.slug.message}</p>}
      </div>

      <div className="cr-field">
        <label htmlFor="room-desc">What is it about?</label>
        <div className="cr-box cr-box--area">
          <textarea id="room-desc" {...register('description')} maxLength={ROOM_LIMITS.DESCRIPTION_MAX} rows={3} placeholder="Who it's for and what happens here" className="cr-box__input" />
          <span className="cr-box__count">{descLen}/{ROOM_LIMITS.DESCRIPTION_MAX}</span>
        </div>
        {errors.description && <p role="alert" className={error}>{errors.description.message}</p>}
      </div>
    </div>
  );
};

/** Step 3: house rules and the host agreement. */
export const RulesStep = ({ form }: StepProps) => {
  const { register, control, formState: { errors } } = form;
  const { fields, append, remove } = useFieldArray({ control, name: 'rules' });
  const current = useWatch({ control, name: 'rules' }).map((r) => r.value.trim());
  const room = fields.length < ROOM_LIMITS.CREATE_RULES_MAX;
  const quick = QUICK_RULES.filter((q) => !current.includes(q)).slice(0, 3);
  return (
    <div className="flex flex-col gap-5">
      <div>
        <ol className="cr-rules">
          {fields.map((field, i) => (
            <li key={field.id}>
              <span aria-hidden className="cr-rules__n">{i + 1}</span>
              <input
                {...register(`rules.${i}.value`)}
                maxLength={ROOM_LIMITS.RULE_MAX}
                aria-label={`Rule ${i + 1}`}
                placeholder="Add a rule"
                className="cr-rules__input"
              />
              {fields.length > 1 && (
                <button type="button" onClick={() => remove(i)} aria-label={`Remove rule ${i + 1}`} className="cr-rules__x">
                  <span aria-hidden>✕</span>
                </button>
              )}
              {errors.rules?.[i]?.value && <p role="alert" className={`${error} cr-rules__err`}>{errors.rules[i].value.message}</p>}
            </li>
          ))}
        </ol>
        {errors.rules?.message && <p role="alert" className={error}>{errors.rules.message}</p>}
        {errors.rules?.root?.message && <p role="alert" className={error}>{errors.rules.root.message}</p>}
        {room && (
          <div className="cr-quick">
            <button type="button" onClick={() => append({ value: '' })} className="cr-add">
              <span aria-hidden>+</span> Add a rule
            </button>
            {quick.map((q) => (
              <button key={q} type="button" onClick={() => append({ value: q })} className="cr-chip">
                {q}
              </button>
            ))}
          </div>
        )}
      </div>

      <div>
        <label className="cr-accept">
          <input type="checkbox" {...register('accept')} className="mt-1 accent-green" />
          I'll host this room. I'll enforce these rules, act on reports fast, and I know abusive rooms get closed and banned without warning.
        </label>
        {errors.accept && <p role="alert" className={error}>{errors.accept.message}</p>}
      </div>
    </div>
  );
};
