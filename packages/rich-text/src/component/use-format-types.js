/**
 * WordPress dependencies
 */
import { useSelect, __unstableUseDispatchWithMap } from '@wordpress/data';

function formatTypesSelector( select ) {
	return select( 'core/rich-text' ).getFormatTypes();
}

/**
 * This higher-order component provides RichText with the `formatTypes` prop
 * and its derived props from experimental format type settings.
 *
 * @param {WPComponent} RichText The rich text component to add props for.
 *
 * @return {WPComponent} New enhanced component.
 */
export function useFormatTypes( { clientId, identifier } ) {
	const formatTypes = useSelect( formatTypesSelector, [] );
	const {
		selectProps,
		dependencies,
		prepareHandlers,
		valueHandlers,
	} = useSelect(
		( select ) =>
			formatTypes.reduce(
				( acc, settings ) => {
					const args = {
						richTextIdentifier: identifier,
						blockClientId: clientId,
					};

					let selected;

					if (
						settings.__experimentalGetPropsForEditableTreePreparation
					) {
						selected = settings.__experimentalGetPropsForEditableTreePreparation(
							select,
							args
						);

						acc.dependencies.push( ...Object.values( selected ) );
						acc.selectProps[ settings.name ] = selected;
					}

					if ( settings.__experimentalCreatePrepareEditableTree ) {
						const handler = settings.__experimentalCreatePrepareEditableTree(
							selected,
							args
						);

						if (
							settings.__experimentalCreateOnChangeEditableValue
						) {
							acc.valueHandlers.push( handler );
						} else {
							acc.prepareHandlers.push( handler );
						}
					}

					return acc;
				},
				{
					dependencies: [],
					selectProps: {},
					prepareHandlers: [],
					valueHandlers: [],
				}
			),
		[ formatTypes, clientId, identifier ]
	);
	const changeHandlers = __unstableUseDispatchWithMap(
		( dispatch ) =>
			formatTypes.reduce( ( acc, settings ) => {
				let dispatcher;

				if (
					settings.__experimentalGetPropsForEditableTreeChangeHandler
				) {
					dispatcher = settings.__experimentalGetPropsForEditableTreeChangeHandler(
						dispatch,
						{
							richTextIdentifier: identifier,
							blockClientId: clientId,
						}
					);
					dispatcher = {
						...selectProps[ settings.name ],
						...dispatcher,
					};
				}

				if ( settings.__experimentalCreateOnChangeEditableValue ) {
					acc.push(
						settings.__experimentalCreateOnChangeEditableValue(
							dispatcher,
							{
								richTextIdentifier: identifier,
								blockClientId: clientId,
							}
						)
					);
				}

				return acc;
			}, [] ),
		[ formatTypes, clientId, identifier, ...dependencies ]
	);

	return {
		formatTypes,
		prepareHandlers,
		valueHandlers,
		changeHandlers,
		dependencies,
	};
}
