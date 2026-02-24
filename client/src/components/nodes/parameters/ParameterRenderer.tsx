/**
 * ParameterRenderer - Dispatches to the correct parameter component based on type.
 */

import { memo, useCallback } from 'react';
import { ParameterDefinition } from '@/types';
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
}

export const ParameterRenderer = memo(function ParameterRenderer({
  param,
  value,
  onChange,
}: ParameterRendererProps) {
  const handleChange = useCallback(
    (v: number | string | boolean | number[]) => onChange(param.id, v),
    [param.id, onChange],
  );

  switch (param.type) {
    case 'float':
      return <FloatParam param={param} value={value as number} onChange={handleChange as (v: number) => void} />;
    case 'int':
      return <IntParam param={param} value={value as number} onChange={handleChange as (v: number) => void} />;
    case 'bool':
      return <BoolParam param={param} value={value as boolean} onChange={handleChange as (v: boolean) => void} />;
    case 'color':
    case 'hdrColor':
      return <ColorParam param={param} value={value as string} onChange={handleChange as (v: string) => void} />;
    case 'option':
      return <OptionParam param={param} value={value as number | string} onChange={handleChange as (v: number | string) => void} />;
    case 'angle':
      return <AngleParam param={param} value={value as number} onChange={handleChange as (v: number) => void} />;
    case 'curve':
      return <CurveParam param={param} value={value as number[]} onChange={handleChange as (v: number[]) => void} />;
    case 'vec2':
      return <Vec2Param param={param} value={value as number[]} onChange={handleChange as (v: number[]) => void} />;
    default:
      return null;
  }
});
