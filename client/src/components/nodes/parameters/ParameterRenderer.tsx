/**
 * ParameterRenderer - Dispatches to the correct parameter component based on type.
 * Looks up parameter hints and passes them to child components.
 */

import { memo, useCallback } from 'react';
import { ParameterDefinition } from '@/types';
import { getParameterHint } from '@/data/parameterHints';
import { FloatParam } from './FloatParam';
import { IntParam } from './IntParam';
import { BoolParam } from './BoolParam';
import { ColorParam } from './ColorParam';
import { OptionParam } from './OptionParam';
import { AngleParam } from './AngleParam';
import { CurveParam } from './CurveParam';
import { Vec2Param } from './Vec2Param';

interface ParameterRendererProps {
  param: ParameterDefinition;
  value: number | string | boolean | number[];
  onChange: (paramId: string, value: number | string | boolean | number[]) => void;
  definitionId?: string;
}

export const ParameterRenderer = memo(function ParameterRenderer({
  param,
  value,
  onChange,
  definitionId,
}: ParameterRendererProps) {
  const handleChange = useCallback(
    (v: number | string | boolean | number[]) => onChange(param.id, v),
    [param.id, onChange],
  );

  const hint = definitionId ? getParameterHint(definitionId, param.id) : undefined;

  switch (param.type) {
    case 'float':
      return <FloatParam param={param} value={value as number} onChange={handleChange as (v: number) => void} hint={hint} />;
    case 'int':
      return <IntParam param={param} value={value as number} onChange={handleChange as (v: number) => void} hint={hint} />;
    case 'bool':
      return <BoolParam param={param} value={value as boolean} onChange={handleChange as (v: boolean) => void} hint={hint} />;
    case 'color':
    case 'hdrColor':
      return <ColorParam param={param} value={value as string} onChange={handleChange as (v: string) => void} hint={hint} />;
    case 'option':
      return <OptionParam param={param} value={value as number | string} onChange={handleChange as (v: number | string) => void} hint={hint} />;
    case 'angle':
      return <AngleParam param={param} value={value as number} onChange={handleChange as (v: number) => void} hint={hint} />;
    case 'curve':
      return <CurveParam param={param} value={value as number[]} onChange={handleChange as (v: number[]) => void} hint={hint} />;
    case 'vec2':
      return <Vec2Param param={param} value={value as number[]} onChange={handleChange as (v: number[]) => void} hint={hint} />;
    default:
      return null;
  }
});
