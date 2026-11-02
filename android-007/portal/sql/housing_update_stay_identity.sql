create or replace function public.housing_update_stay_identity(p_stay_id uuid,p_rider_id text,p_rider_name text,p_expected_rider_id text,p_expected_rider_name text) returns jsonb language plpgsql security definer set search_path=public,pg_temp as $$
declare s public.housing_stays%rowtype; v_id text:=btrim(p_rider_id); v_name text:=btrim(p_rider_name);
begin
 if auth.uid() is null or not public.housing_is_admin() then raise exception 'تعديل بيانات المندوب متاح للإدارة فقط'; end if;
 if v_id is null or v_id !~ '^[0-9]{1,30}$' or v_name is null or char_length(v_name)<2 or char_length(v_name)>200 then raise exception 'اكتب اسم المندوب وID صحيح بالأرقام'; end if;
 perform pg_advisory_xact_lock(hashtextextended('housing_identity',0));
 select * into s from public.housing_stays where id=p_stay_id for update;
 if not found or s.status<>'ACTIVE' then raise exception 'الإقامة غير موجودة أو غير نشطة'; end if;
 if s.rider_id is distinct from p_expected_rider_id or s.rider_name is distinct from p_expected_rider_name then raise exception 'البيانات اتعدلت؛ حدّث الصفحة وحاول مرة أخرى'; end if;
 if s.rider_id=v_id and s.rider_name=v_name then return jsonb_build_object('ok',true); end if;
 if v_id<>s.rider_id and exists(select 1 from public.housing_stays h where h.id<>s.id and h.zone_id=s.zone_id and h.rider_id=v_id and h.status<>'CANCELLED') then raise exception 'الـID مسجل لمندوب آخر في السكن؛ راجع البيانات'; end if;
 if exists(select 1 from public.housing_monthly_close_items i join public.housing_monthly_closures c on c.id=i.closure_id where (i.stay_id=s.id or s.id=any(i.stay_ids)) and (c.status='CLOSED' or cardinality(i.stay_ids)>1)) then raise exception 'الإقامة مرتبطة بتقفيلة مقفولة أو مجمعة؛ يلزم مراجعتها قبل تصحيح البيانات'; end if;
 update public.housing_stays set rider_id=v_id,rider_name=v_name,updated_at=now() where id=s.id;
 update public.housing_requests set rider_id=v_id,rider_name=v_name,updated_at=now() where stay_id=s.id or id=s.check_in_request_id or id=s.check_out_request_id;
 update public.housing_monthly_close_items set rider_id=v_id,rider_name=v_name,updated_at=now() where stay_id=s.id or s.id=any(stay_ids);
 insert into public.audit_log(actor_id,action,entity_type,entity_id,details) values(auth.uid(),'HOUSING_STAY_IDENTITY_CHANGED','housing_stay',s.id,jsonb_build_object('old_rider_id',s.rider_id,'new_rider_id',v_id,'old_rider_name',s.rider_name,'new_rider_name',v_name));
 return jsonb_build_object('ok',true,'stay_id',s.id);
end $$;
revoke all on function public.housing_update_stay_identity(uuid,text,text,text,text) from public,anon;
grant execute on function public.housing_update_stay_identity(uuid,text,text,text,text) to authenticated;
notify pgrst,'reload schema';